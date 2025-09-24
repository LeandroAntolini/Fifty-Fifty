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

// Map Supabase imovel to frontend Imovel type
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

// --- PLACEHOLDER FUNCTIONS ---
// These will be implemented in the next steps.

export const getClientesByCorretor = async (corretorId: string): Promise<Cliente[]> => { console.warn("getClientesByCorretor not implemented in supabaseApi"); return []; };
export const createCliente = async (clienteData: any): Promise<Cliente> => { throw new Error("createCliente not implemented in supabaseApi"); };
export const getMatchesByCorretor = async (corretorId: string): Promise<Match[]> => { console.warn("getMatchesByCorretor not implemented in supabaseApi"); return []; };
export const findMatchesForImovel = async (imovel: Imovel): Promise<Match[]> => { console.warn("findMatchesForImovel not implemented in supabaseApi"); return []; };
export const getMatchById = async (matchId: string): Promise<Match | undefined> => { console.warn("getMatchById not implemented in supabaseApi"); return undefined; };
export const getMessagesByMatch = async (matchId: string): Promise<Message[]> => { console.warn("getMessagesByMatch not implemented in supabaseApi"); return []; };
export const sendMessage = async (messageData: any): Promise<Message> => { throw new Error("sendMessage not implemented in supabaseApi"); };
export const getMetricas = async (): Promise<Metric[]> => { console.warn("getMetricas not implemented in supabaseApi"); return []; };
export const getImoveis = async (): Promise<Imovel[]> => { console.warn("getImoveis not implemented in supabaseApi"); return []; };
export const getClientes = async (): Promise<Cliente[]> => { console.warn("getClientes not implemented in supabaseApi"); return []; };