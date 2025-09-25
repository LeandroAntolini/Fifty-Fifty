import { supabase } from '../src/integrations/supabase/client';
import { Corretor, Imovel, ImovelStatus, Finalidade, Cliente, ClienteStatus, Match, MatchStatus, Message, ReadStatus, Parceria, ParceriaStatus, Metric } from '../types';

// Helper to convert base64 to a File object for uploading
const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || mimeMatch.length < 2) {
        throw new Error('Invalid base64 string');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

export interface ImageChanges {
  newImagesBase64?: string[];
  imagesToDelete?: string[];
}


// --- IMOVEIS ---

const mapSupabaseImovelToImovel = (imovel: any): Imovel => ({
    ID_Imovel: imovel.id,
    ID_Corretor: imovel.id_corretor,
    Tipo: imovel.tipo,
    Finalidade: imovel.finalidade,
    Cidade: imovel.cidade,
    Estado: imovel.estado,
    Bairro: imovel.bairro,
    Valor: imovel.valor,
    Dormitorios: imovel.dormitorios,
    Metragem: imovel.metragem,
    Status: imovel.status,
    Imagens: imovel.imagens || [],
    CreatedAt: imovel.created_at,
});

export const getImoveisByCorretor = async (corretorId: string): Promise<Imovel[]> => {
    const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id_corretor', corretorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching imoveis:', error);
        throw error;
    }

    return data.map(mapSupabaseImovelToImovel);
};

export const createImovel = async (imovelData: Omit<Imovel, 'ID_Imovel' | 'Status' | 'CreatedAt'> & { Imagens?: string[] }): Promise<Imovel> => {
    const { Imagens, ID_Corretor, ...rest } = imovelData;
    let imageUrls: string[] = [];

    if (Imagens && Imagens.length > 0) {
        try {
            const uploadPromises = Imagens.map(async (base64Image, index) => {
                const file = base64ToFile(base64Image, `imovel-${Date.now()}-${index}.png`);
                const filePath = `${ID_Corretor}/${file.name}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('imoveis-imagens')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('imoveis-imagens')
                    .getPublicUrl(filePath);
                
                return publicUrl;
            });

            imageUrls = await Promise.all(uploadPromises);
        } catch (error) {
            console.error('An error occurred during image upload:', error);
            throw error;
        }
    }

    const newImovelData = {
        id_corretor: ID_Corretor,
        tipo: rest.Tipo,
        finalidade: rest.Finalidade,
        cidade: rest.Cidade,
        estado: rest.Estado,
        bairro: rest.Bairro,
        valor: rest.Valor,
        dormitorios: rest.Dormitorios,
        metragem: rest.Metragem,
        imagens: imageUrls,
        status: ImovelStatus.Ativo,
    };

    const { data, error } = await supabase
        .from('imoveis')
        .insert(newImovelData)
        .select()
        .single();

    if (error) {
        console.error('Error creating imovel:', error);
        throw error;
    }

    return mapSupabaseImovelToImovel(data);
};

export const updateImovel = async (
    imovelId: string,
    imovelData: Partial<Omit<Imovel, 'ID_Imovel' | 'ID_Corretor' | 'CreatedAt'>>,
    imageChanges?: ImageChanges
): Promise<Imovel> => {
    const { newImagesBase64 = [], imagesToDelete = [] } = imageChanges || {};

    // 1. Delete marked images from storage
    if (imagesToDelete.length > 0) {
        const filePaths = imagesToDelete.map(url => {
            const urlParts = url.split('/');
            const bucketNameIndex = urlParts.findIndex(part => part === 'imoveis-imagens');
            return bucketNameIndex !== -1 ? urlParts.slice(bucketNameIndex + 1).join('/') : '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage.from('imoveis-imagens').remove(filePaths);
            if (storageError) {
                console.error('Error deleting images:', storageError);
            }
        }
    }

    // 2. Upload new images to storage
    let newImageUrls: string[] = [];
    if (newImagesBase64.length > 0) {
        const { data: imovelOwner, error: ownerError } = await supabase.from('imoveis').select('id_corretor').eq('id', imovelId).single();
        if (ownerError || !imovelOwner) throw new Error("Imóvel não encontrado para adicionar imagens.");
        const ID_Corretor = imovelOwner.id_corretor;

        const uploadPromises = newImagesBase64.map(async (base64Image, index) => {
            const file = base64ToFile(base64Image, `imovel-${Date.now()}-${index}.png`);
            const filePath = `${ID_Corretor}/${file.name}`;
            const { error: uploadError } = await supabase.storage.from('imoveis-imagens').upload(filePath, file, { upsert: false });
            if (uploadError) throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage.from('imoveis-imagens').getPublicUrl(filePath);
            return publicUrl;
        });
        newImageUrls = await Promise.all(uploadPromises);
    }

    // 3. Get current imovel to update its image array
    const { data: currentImovel, error: fetchError } = await supabase.from('imoveis').select('imagens').eq('id', imovelId).single();
    if (fetchError) throw new Error("Não foi possível buscar os dados atuais do imóvel.");

    const currentImageUrls = currentImovel.imagens || [];
    const updatedImageUrls = currentImageUrls
        .filter(url => !imagesToDelete.includes(url))
        .concat(newImageUrls);

    // 4. Update the imovel record in the database
    const updateData = {
        tipo: imovelData.Tipo,
        finalidade: imovelData.Finalidade,
        cidade: imovelData.Cidade,
        estado: imovelData.Estado,
        bairro: imovelData.Bairro,
        valor: imovelData.Valor,
        dormitorios: imovelData.Dormitorios,
        metragem: imovelData.Metragem,
        status: imovelData.Status,
        imagens: updatedImageUrls,
    };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase.from('imoveis').update(updateData).eq('id', imovelId).select().single();
    if (error) {
        console.error('Error updating imovel record:', error);
        throw error;
    }
    return mapSupabaseImovelToImovel(data);
};

export const deleteImovel = async (imovelId: string, imageUrls: string[] = []) => {
    if (imageUrls && imageUrls.length > 0) {
        const filePaths = imageUrls.map(url => {
            const urlParts = url.split('/');
            const bucketNameIndex = urlParts.findIndex(part => part === 'imoveis-imagens');
            if (bucketNameIndex !== -1) {
                return urlParts.slice(bucketNameIndex + 1).join('/');
            }
            return '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('imoveis-imagens')
                .remove(filePaths);
            if (storageError) {
                console.error('Error deleting imovel images:', storageError);
            }
        }
    }

    const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', imovelId);

    if (error) {
        console.error('Error deleting imovel:', error);
        throw error;
    }
};


// --- CLIENTES ---

const mapSupabaseClienteToCliente = (cliente: any): Cliente => ({
    ID_Cliente: cliente.id,
    ID_Corretor: cliente.id_corretor,
    TipoImovelDesejado: cliente.tipo_imovel_desejado,
    Finalidade: cliente.finalidade,
    CidadeDesejada: cliente.cidade_desejada,
    EstadoDesejado: cliente.estado_desejado,
    BairroRegiaoDesejada: cliente.bairro_regiao_desejada,
    FaixaValorMin: cliente.faixa_valor_min,
    FaixaValorMax: cliente.faixa_valor_max,
    DormitoriosMinimos: cliente.dormitorios_minimos,
    Status: cliente.status,
    CreatedAt: cliente.created_at,
});

export const getClientesByCorretor = async (corretorId: string): Promise<Cliente[]> => {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id_corretor', corretorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clientes:', error);
        throw error;
    }

    return data.map(mapSupabaseClienteToCliente);
};

export const createCliente = async (clienteData: Omit<Cliente, 'ID_Cliente' | 'Status' | 'CreatedAt'>): Promise<Cliente> => {
    const newClienteData = {
        id_corretor: clienteData.ID_Corretor,
        tipo_imovel_desejado: clienteData.TipoImovelDesejado,
        finalidade: clienteData.Finalidade,
        cidade_desejada: clienteData.CidadeDesejada,
        estado_desejado: clienteData.EstadoDesejado,
        bairro_regiao_desejada: clienteData.BairroRegiaoDesejada,
        faixa_valor_min: clienteData.FaixaValorMin,
        faixa_valor_max: clienteData.FaixaValorMax,
        dormitorios_minimos: clienteData.DormitoriosMinimos,
        status: ClienteStatus.Ativo,
    };

    const { data, error } = await supabase
        .from('clientes')
        .insert(newClienteData)
        .select()
        .single();

    if (error) {
        console.error('Error creating cliente:', error);
        throw error;
    }

    return mapSupabaseClienteToCliente(data);
};

export const updateCliente = async (clienteId: string, clienteData: Partial<Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'CreatedAt'>>): Promise<Cliente> => {
    const updateData = {
        tipo_imovel_desejado: clienteData.TipoImovelDesejado,
        finalidade: clienteData.Finalidade,
        cidade_desejada: clienteData.CidadeDesejada,
        estado_desejado: clienteData.EstadoDesejado,
        bairro_regiao_desejada: clienteData.BairroRegiaoDesejada,
        faixa_valor_min: clienteData.FaixaValorMin,
        faixa_valor_max: clienteData.FaixaValorMax,
        dormitorios_minimos: clienteData.DormitoriosMinimos,
        status: clienteData.Status,
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', clienteId)
        .select()
        .single();

    if (error) {
        console.error('Error updating cliente:', error);
        throw error;
    }
    return mapSupabaseClienteToCliente(data);
};

export const deleteCliente = async (clienteId: string) => {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

    if (error) {
        console.error('Error deleting cliente:', error);
        throw error;
    }
};

// --- CORRETORES ---

export const updateCorretor = async (corretorId: string, corretorData: Partial<Omit<Corretor, 'ID_Corretor' | 'Email' | 'CRECI'>>): Promise<void> => {
    const updateData = {
        nome: corretorData.Nome,
        telefone: corretorData.Telefone,
        cidade: corretorData.Cidade,
        estado: corretorData.Estado,
    };

    // Remove undefined properties so they are not updated
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { error } = await supabase
        .from('corretores')
        .update(updateData)
        .eq('id', corretorId);

    if (error) {
        console.error('Error updating corretor:', error);
        throw error;
    }
};

// --- MATCHES ---

const mapSupabaseMatchToMatch = (match: any): Match => ({
    ID_Match: match.id,
    ID_Imovel: match.id_imovel,
    ID_Cliente: match.id_cliente,
    Corretor_A_ID: match.id_corretor_imovel,
    Corretor_B_ID: match.id_corretor_cliente,
    Match_Timestamp: match.created_at,
    Status: match.status,
});

export const getAugmentedMatchesByCorretor = async (corretorId: string) => {
    const { data, error } = await supabase.rpc('get_augmented_matches_for_corretor', {
        p_corretor_id: corretorId,
    });

    if (error) {
        console.error('Error fetching augmented matches:', error);
        throw error;
    }
    return data;
};

export const findMatchesForImovel = async (imovel: Imovel): Promise<Match[]> => {
    const { data, error } = await supabase.functions.invoke('find-matches', {
        body: { imovel },
    });

    if (error) {
        console.error('Error finding matches for imovel:', error);
        throw error;
    }
    return (data || []).map(mapSupabaseMatchToMatch);
};

export const findMatchesForCliente = async (cliente: Cliente): Promise<Match[]> => {
    const { data, error } = await supabase.functions.invoke('find-matches-for-cliente', {
        body: { cliente },
    });

    if (error) {
        console.error('Error finding matches for cliente:', error);
        throw error;
    }
    return (data || []).map(mapSupabaseMatchToMatch);
};

export const getMatchById = async (matchId: string): Promise<Match | undefined> => {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

    if (error) {
        // Supabase throws an error if no row is found, which is expected.
        if (error.code !== 'PGRST116') {
            console.error('Error fetching match by id:', error);
            throw error;
        }
    }
    return data ? mapSupabaseMatchToMatch(data) : undefined;
};

export const closeMatch = async (matchId: string): Promise<void> => {
    const { error } = await supabase
        .from('matches')
        .update({ status: MatchStatus.Fechado })
        .eq('id', matchId);

    if (error) {
        console.error('Error closing match:', error);
        throw error;
    }
};


// --- MESSAGES / CHAT ---

const mapSupabaseMessageToMessage = (msg: any): Message => ({
    ID_Message: msg.id,
    ID_Match: msg.id_match,
    ID_Parceria: null, // Not implemented yet
    From_Corretor_ID: msg.from_corretor_id,
    To_Corretor_ID: msg.to_corretor_id,
    Timestamp: msg.created_at,
    Message_Text: msg.message_text,
    Read_Status: msg.read_status,
});

export const getMessagesByMatch = async (matchId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id_match', matchId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
    return data.map(mapSupabaseMessageToMessage);
};

export const sendMessage = async (messageData: Omit<Message, 'ID_Message' | 'Timestamp' | 'Read_Status' | 'ID_Parceria'>): Promise<Message> => {
    const newMessageData = {
        id_match: messageData.ID_Match,
        from_corretor_id: messageData.From_Corretor_ID,
        to_corretor_id: messageData.To_Corretor_ID,
        message_text: messageData.Message_Text,
    };

    const { data, error } = await supabase
        .from('messages')
        .insert(newMessageData)
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        throw error;
    }
    return mapSupabaseMessageToMessage(data);
};

// --- PARCERIAS ---

export const getAugmentedParceriasByCorretor = async (corretorId: string) => {
    const { data, error } = await supabase.rpc('get_augmented_parcerias_for_corretor', {
        p_corretor_id: corretorId,
    });

    if (error) {
        console.error('Error fetching augmented parcerias:', error);
        throw error;
    }
    return data;
};

export const createParceriaFromMatch = async (match: Match): Promise<Parceria> => {
    const { data, error } = await supabase.rpc('concluir_parceria', {
        p_match_id: match.ID_Match,
        p_imovel_id: match.ID_Imovel,
        p_corretor_a_id: match.Corretor_A_ID,
        p_corretor_b_id: match.Corretor_B_ID,
        p_cliente_id: match.ID_Cliente
    });

    if (error || !data || data.length === 0) {
        console.error('Error creating parceria via RPC:', error);
        throw error || new Error("Failed to create partnership.");
    }

    const result = data[0];
    const mappedParceria: Parceria = {
        ID_Parceria: result.ID_Parceria,
        ID_Imovel: result.ID_Imovel,
        ID_Cliente: result.ID_Cliente,
        CorretorA_ID: result.CorretorA_ID,
        CorretorB_ID: result.CorretorB_ID,
        DataFechamento: result.DataFechamento,
        Status: result.Status,
    };

    return mappedParceria;
};

// --- CHATS ---
export const getActiveChatsByCorretor = async (corretorId: string) => {
    const { data, error } = await supabase.rpc('get_active_chats_for_corretor', {
        p_corretor_id: corretorId,
    });

    if (error) {
        console.error('Error fetching active chats:', error);
        throw error;
    }
    return data;
};


// --- METRICAS ---
export const getMetricas = async (): Promise<Metric[]> => {
    const { data, error } = await supabase.rpc('get_corretor_metrics');

    if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
    }
    
    // The data from RPC should match the Metric type, but we cast it to be safe.
    return data as Metric[];
};

// --- NOTIFICATIONS ---

export const getUnreadMessagesCount = async (corretorId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('count_unread_messages_in_open_matches', {
        p_corretor_id: corretorId
    });

    if (error) {
        console.error('Error fetching unread messages count:', error);
        return 0;
    }
    return data || 0;
};

export const getNewMatchesCount = async (corretorId: string): Promise<number> => {
    const { data, error } = await supabase.rpc('count_new_matches_for_corretor', {
        p_corretor_id: corretorId
    });

    if (error) {
        console.error('Error fetching new matches count:', error);
        return 0;
    }
    return data || 0;
};

export const markMessagesAsRead = async (matchId: string, readerId: string): Promise<void> => {
    const { error } = await supabase
        .from('messages')
        .update({ read_status: ReadStatus.Lido })
        .eq('id_match', matchId)
        .eq('to_corretor_id', readerId)
        .eq('read_status', ReadStatus.NaoLido);

    if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
};

export const markMatchAsViewed = async (matchId: string, userId: string): Promise<void> => {
    const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('id_corretor_imovel, id_corretor_cliente, viewed_by_corretor_imovel, viewed_by_corretor_cliente')
        .eq('id', matchId)
        .single();

    if (fetchError || !match) {
        console.error("Could not find match to mark as viewed", fetchError);
        return;
    }

    const updateData: { [key: string]: boolean } = {};
    if (match.id_corretor_imovel === userId && !match.viewed_by_corretor_imovel) {
        updateData.viewed_by_corretor_imovel = true;
    } else if (match.id_corretor_cliente === userId && !match.viewed_by_corretor_cliente) {
        updateData.viewed_by_corretor_cliente = true;
    }

    if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
            .from('matches')
            .update(updateData)
            .eq('id', matchId);

        if (updateError) {
            console.error("Failed to mark match as viewed", updateError);
        }
    }
};