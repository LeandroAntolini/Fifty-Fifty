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
    Status: imovel.status,
    Imagens: imovel.imagens || [],
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

export const createImovel = async (imovelData: Omit<Imovel, 'ID_Imovel' | 'Status'> & { Imagens?: string[] }): Promise<Imovel> => {
    const { Imagens, ID_Corretor, ...rest } = imovelData;
    let imageUrls: string[] = [];

    if (Imagens && Imagens.length > 0) {
        const uploadPromises = Imagens.map(async (base64Image, index) => {
            try {
                const file = base64ToFile(base64Image, `imovel-${Date.now()}-${index}.png`);
                const filePath = `${ID_Corretor}/${file.name}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('imoveis-imagens')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    return null;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('imoveis-imagens')
                    .getPublicUrl(filePath);
                
                return publicUrl;
            } catch (error) {
                console.error('Error processing base64 image:', error);
                return null;
            }
        });

        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter((url): url is string => url !== null);
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

export const updateImovel = async (imovelId: string, imovelData: Partial<Omit<Imovel, 'ID_Imovel' | 'ID_Corretor'>>): Promise<Imovel> => {
    const updateData = {
        tipo: imovelData.Tipo,
        finalidade: imovelData.Finalidade,
        cidade: imovelData.Cidade,
        estado: imovelData.Estado,
        bairro: imovelData.Bairro,
        valor: imovelData.Valor,
        dormitorios: imovelData.Dormitorios,
        status: imovelData.Status,
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase
        .from('imoveis')
        .update(updateData)
        .eq('id', imovelId)
        .select()
        .single();

    if (error) {
        console.error('Error updating imovel:', error);
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

export const createCliente = async (clienteData: Omit<Cliente, 'ID_Cliente' | 'Status'>): Promise<Cliente> => {
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

export const updateCliente = async (clienteId: string, clienteData: Partial<Omit<Cliente, 'ID_Cliente' | 'ID_Corretor'>>): Promise<Cliente> => {
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


// --- PUBLIC GETTERS (for augmenting data on frontend) ---

export const getImoveis = async (): Promise<Imovel[]> => {
    const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('status', 'Ativo');
    
    if (error) {
        console.error('Error fetching all imoveis:', error);
        throw error;
    }
    return data.map(mapSupabaseImovelToImovel);
};

export const getClientes = async (): Promise<Cliente[]> => {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('status', 'Ativo');
    
    if (error) {
        console.error('Error fetching all clientes:', error);
        throw error;
    }
    return data.map(mapSupabaseClienteToCliente);
};

export const getCorretores = async (): Promise<Pick<Corretor, 'ID_Corretor' | 'Nome'>[]> => {
    const { data, error } = await supabase
        .from('corretores')
        .select('id, nome');
    
    if (error) {
        console.error('Error fetching corretores:', error);
        throw error;
    }
    return data.map(c => ({ ID_Corretor: c.id, Nome: c.nome }));
}


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

export const getMatchesByCorretor = async (corretorId: string): Promise<Match[]> => {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`id_corretor_imovel.eq.${corretorId},id_corretor_cliente.eq.${corretorId}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching matches:', error);
        throw error;
    }
    return data.map(mapSupabaseMatchToMatch);
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

const mapSupabaseParceriaToParceria = (p: any): Parceria => ({
    ID_Parceria: p.id,
    ID_Imovel: p.id_imovel,
    ID_Cliente: p.id_cliente,
    CorretorA_ID: p.id_corretor_a,
    CorretorB_ID: p.id_corretor_b,
    DataFechamento: p.data_fechamento,
    Status: p.status,
});

export const getParceriasByCorretor = async (corretorId: string): Promise<Parceria[]> => {
    const { data, error } = await supabase
        .from('parcerias')
        .select('*')
        .or(`id_corretor_a.eq.${corretorId},id_corretor_b.eq.${corretorId}`)
        .order('data_fechamento', { ascending: false });

    if (error) {
        console.error('Error fetching parcerias:', error);
        throw error;
    }
    return data.map(mapSupabaseParceriaToParceria);
};

export const createParceriaFromMatch = async (match: Match): Promise<Parceria> => {
    // 1. Update match status
    const { error: matchUpdateError } = await supabase
        .from('matches')
        .update({ status: MatchStatus.Convertido })
        .eq('id', match.ID_Match);

    if (matchUpdateError) {
        console.error('Error updating match status:', matchUpdateError);
        throw matchUpdateError;
    }

    // 2. Create parceria
    const newParceriaData = {
        id_match: match.ID_Match,
        id_imovel: match.ID_Imovel,
        id_cliente: match.ID_Cliente,
        id_corretor_a: match.Corretor_A_ID,
        id_corretor_b: match.Corretor_B_ID,
        status: ParceriaStatus.Concluida,
    };

    const { data, error } = await supabase
        .from('parcerias')
        .insert(newParceriaData)
        .select()
        .single();

    if (error) {
        console.error('Error creating parceria:', error);
        throw error;
    }

    return mapSupabaseParceriaToParceria(data);
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