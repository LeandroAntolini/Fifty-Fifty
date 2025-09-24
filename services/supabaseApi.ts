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

// --- CLIENTES ---

const mapSupabaseClienteToCliente = (cliente: any): Cliente => ({
    ID_Cliente: cliente.id,
    ID_Corretor: cliente.id_corretor,
    TipoImovelDesejado: cliente.tipo_imovel_desejado,
    Finalidade: cliente.finalidade,
    CidadeDesejada: cliente.cidade_desejada,
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


// --- PLACEHOLDER FUNCTIONS ---
export const getMatchesByCorretor = async (corretorId: string): Promise<Match[]> => { console.warn("getMatchesByCorretor not implemented in supabaseApi"); return []; };
export const findMatchesForImovel = async (imovel: Imovel): Promise<Match[]> => { console.warn("findMatchesForImovel not implemented in supabaseApi"); return []; };
export const getMatchById = async (matchId: string): Promise<Match | undefined> => { console.warn("getMatchById not implemented in supabaseApi"); return undefined; };
export const getMessagesByMatch = async (matchId: string): Promise<Message[]> => { console.warn("getMessagesByMatch not implemented in supabaseApi"); return []; };
export const sendMessage = async (messageData: any): Promise<Message> => { throw new Error("sendMessage not implemented in supabaseApi"); };
export const getMetricas = async (): Promise<Metric[]> => { console.warn("getMetricas not implemented in supabaseApi"); return []; };
export const getImoveis = async (): Promise<Imovel[]> => { console.warn("getImoveis not implemented in supabaseApi"); return []; };
export const getClientes = async (): Promise<Cliente[]> => { console.warn("getClientes not implemented in supabaseApi"); return []; };