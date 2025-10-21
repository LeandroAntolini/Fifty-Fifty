import { supabase } from '../src/integrations/supabase/client';
import { Match, Parceria } from '../types';

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

export const createParceriaFromMatch = async (match: Match, initiatorId: string): Promise<Parceria> => {
    const { data, error } = await supabase.rpc('concluir_parceria', {
        p_match_id: match.ID_Match,
        p_imovel_id: match.ID_Imovel,
        p_corretor_a_id: match.Corretor_A_ID,
        p_corretor_b_id: match.Corretor_B_ID,
        p_cliente_id: match.ID_Cliente,
        p_initiator_id: initiatorId
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
        CorretorB_ID: result.CorretorB_B_ID,
        DataFechamento: result.DataFechamento,
        Status: result.Status,
    };

    return mappedParceria;
};