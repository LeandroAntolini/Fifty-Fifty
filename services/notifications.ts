import { supabase } from '../src/integrations/supabase/client';

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

export const getArchivedChatsByCorretor = async (corretorId: string) => {
    const { data, error } = await supabase.rpc('get_archived_chats_for_corretor', {
        p_corretor_id: corretorId,
    });

    if (error) {
        console.error('Error fetching archived chats:', error);
        throw error;
    }
    return data;
};

export const getNewFollowers = async (followingId: string): Promise<{ follower_id: string, created_at: string, follower_name: string }[]> => {
    // Filtra apenas os follows que ainda não foram notificados (notified_follower = false)
    const { data, error } = await supabase
        .from('followers')
        .select('follower_id, created_at, notified_follower, corretor:follower_id(nome)')
        .eq('following_id', followingId)
        .eq('notified_follower', false);

    if (error) {
        console.error('Error fetching new followers:', error);
        throw error;
    }

    return data.map((item: any) => ({
        follower_id: item.follower_id,
        created_at: item.created_at,
        follower_name: item.corretor.nome,
    }));
};

export const markFollowAsNotified = async (followerId: string, followingId: string): Promise<void> => {
    // A chave primária da tabela 'followers' é composta por (follower_id, following_id).
    // Precisamos usar AMBOS os IDs para garantir que o registro correto seja atualizado.
    const { error } = await supabase
        .from('followers')
        .update({ notified_follower: true })
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) {
        console.error('Error marking follow as notified:', error);
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

export const markMatchStatusChangeAsViewed = async (matchId: string, userId: string): Promise<void> => {
    const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('id_corretor_imovel, id_corretor_cliente')
        .eq('id', matchId)
        .single();

    if (fetchError || !match) {
        console.error("Could not find match to mark status change as viewed", fetchError);
        return;
    }

    const updateData: { [key: string]: boolean } = {};
    if (match.id_corretor_imovel === userId) {
        updateData.status_change_viewed_by_imovel = true;
    } else if (match.id_corretor_cliente === userId) {
        updateData.status_change_viewed_by_cliente = true;
    }

    if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
            .from('matches')
            .update(updateData)
            .eq('id', matchId);

        if (updateError) {
            console.error("Failed to mark match status change as viewed", updateError);
        }
    }
};

export const checkWhatsAppConfig = async (): Promise<{ isConfigured: boolean }> => {
    const { data, error } = await supabase.functions.invoke('check-whatsapp-config');

    if (error) {
        console.error('Error checking WhatsApp config:', error);
        // Assume not configured if there's an error to be safe
        return { isConfigured: false };
    }
    return data;
};