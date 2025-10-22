import { supabase } from '../src/integrations/supabase/client';
import { Match, MatchStatus, Imovel, Cliente } from '../types';

const mapSupabaseMatchToMatch = (match: any): Match => ({
    ID_Match: match.id,
    ID_Imovel: match.id_imovel,
    ID_Cliente: match.id_cliente,
    Corretor_A_ID: match.id_corretor_imovel,
    Corretor_B_ID: match.id_corretor_cliente,
    Match_Timestamp: match.created_at,
    Status: match.status,
    status_change_requester_id: match.status_change_requester_id,
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

export const getActiveMatchBetweenCorretores = async (corretorAId: string, corretorBId: string): Promise<Match | null> => {
    // Busca matches onde A é Imovel Owner e B é Cliente Owner, OU vice-versa
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('status', MatchStatus.Aberto)
        .or(`and(id_corretor_imovel.eq.${corretorAId},id_corretor_cliente.eq.${corretorBId}),and(id_corretor_imovel.eq.${corretorBId},id_corretor_cliente.eq.${corretorAId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
        console.error('Error fetching active match between corretores:', error);
        throw error;
    }

    return data ? mapSupabaseMatchToMatch(data) : null;
};

/**
 * Busca um Match de Chat Direto existente ou cria um novo se não existir.
 */
export const getOrCreateDirectChatMatch = async (corretorAId: string, corretorBId: string): Promise<Match> => {
    // 1. Tenta encontrar um Match de Chat Direto existente
    const { data: existingMatch, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', MatchStatus.ChatDireto)
        // A ordem dos IDs não importa para o chat direto, então verificamos ambas as combinações
        .or(`and(id_corretor_imovel.eq.${corretorAId},id_corretor_cliente.eq.${corretorBId}),and(id_corretor_imovel.eq.${corretorBId},id_corretor_cliente.eq.${corretorAId})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (existingMatch) {
        return mapSupabaseMatchToMatch(existingMatch);
    }
    
    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing direct chat match:', fetchError);
        throw fetchError;
    }

    // 2. Se não existir, cria um novo Match de Chat Direto
    
    // Tenta usar o Imóvel e Cliente mais recentes do corretor A (o iniciador)
    let imovelId = null;
    let clienteId = null;

    // Tenta buscar Imóvel do Corretor A
    const { data: imovelA } = await supabase
        .from('imoveis')
        .select('id')
        .eq('id_corretor', corretorAId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (imovelA) imovelId = imovelA.id;

    // Tenta buscar Cliente do Corretor A
    const { data: clienteA } = await supabase
        .from('clientes')
        .select('id')
        .eq('id_corretor', corretorAId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    if (clienteA) clienteId = clienteA.id;

    // Se o Corretor A não tiver, tenta buscar do Corretor B (o destinatário)
    if (!imovelId) {
        const { data: imovelB } = await supabase
            .from('imoveis')
            .select('id')
            .eq('id_corretor', corretorBId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (imovelB) imovelId = imovelB.id;
    }

    if (!clienteId) {
        const { data: clienteB } = await supabase
            .from('clientes')
            .select('id')
            .eq('id_corretor', corretorBId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (clienteB) clienteId = clienteB.id;
    }

    // Se ainda não tivermos IDs, falha com a mensagem de erro
    if (!imovelId || !clienteId) {
        throw new Error("Você precisa ter pelo menos um Imóvel e um Cliente cadastrados para iniciar um chat direto.");
    }

    // 3. Cria o novo Match de Chat Direto
    const newMatchData = {
        id_imovel: imovelId, // Placeholder
        id_cliente: clienteId, // Placeholder
        id_corretor_imovel: corretorAId, // Corretor A é o iniciador (arbitrário)
        id_corretor_cliente: corretorBId, // Corretor B é o destinatário (arbitrário)
        status: MatchStatus.ChatDireto,
        viewed_by_corretor_imovel: true,
        viewed_by_corretor_cliente: true,
    };

    const { data: newMatch, error: insertError } = await supabase
        .from('matches')
        .insert(newMatchData)
        .select()
        .single();

    if (insertError) {
        console.error('Error creating direct chat match:', insertError);
        throw insertError;
    }

    return mapSupabaseMatchToMatch(newMatch);
};

export const findMatchesForImovel = async (imovel: Imovel): Promise<Match[]> => {
    const { data, error } = await supabase.rpc('create_matches_for_imovel', {
        p_imovel_id: imovel.ID_Imovel,
    });

    if (error) {
        console.error('Error finding matches for imovel:', error);
        throw error;
    }
    return (data || []).map(mapSupabaseMatchToMatch);
};

export const findMatchesForCliente = async (cliente: Cliente): Promise<Match[]> => {
    const { data, error } = await supabase.rpc('create_matches_for_cliente', {
        p_cliente_id: cliente.ID_Cliente,
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
        if (error.code !== 'PGRST116') {
            console.error('Error fetching match by id:', error);
            throw error;
        }
    }
    return data ? mapSupabaseMatchToMatch(data) : undefined;
};

export const closeMatch = async (matchId: string, initiatorId: string): Promise<void> => {
    const { error } = await supabase.rpc('close_match', {
        p_match_id: matchId,
        p_initiator_id: initiatorId
    });

    if (error) {
        console.error('Error closing match:', error);
        throw error;
    }
};

export const requestReopenMatch = async (matchId: string, requesterId: string): Promise<void> => {
    const { error } = await supabase.rpc('request_reopen_match', {
        p_match_id: matchId,
        p_requester_id: requesterId
    });
    if (error) {
        console.error('Error requesting reopen match:', error);
        throw error;
    }
};

export const acceptReopenMatch = async (matchId: string): Promise<void> => {
    const { error } = await supabase.rpc('accept_reopen_match', { p_match_id: matchId });
    if (error) {
        console.error('Error accepting reopen match:', error);
        throw error;
    }
};

export const rejectReopenMatch = async (matchId: string): Promise<void> => {
    const { error } = await supabase.rpc('reject_reopen_match', { p_match_id: matchId });
    if (error) {
        console.error('Error rejecting reopen match:', error);
        throw error;
    }
};