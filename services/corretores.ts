import { supabase } from '../src/integrations/supabase/client';
import { Corretor } from '../types';

export const getCorretorById = async (corretorId: string): Promise<Partial<Corretor> | null> => {
    const { data, error } = await supabase
        .from('corretores')
        .select('*')
        .eq('id', corretorId)
        .single();

    if (error) {
        console.error('Error fetching corretor by id:', error);
        return null;
    }
    
    return {
        ID_Corretor: data.id,
        Nome: data.nome,
    };
};

export const searchCorretores = async (searchTerm: string, currentUserId: string): Promise<Partial<Corretor>[]> => {
    const { data, error } = await supabase
        .from('corretores')
        .select('id, nome, creci, cidade, estado, avatar_url, username')
        .neq('id', currentUserId) // Exclude current user
        .or(`username.ilike.%${searchTerm}%,nome.ilike.%${searchTerm}%`) // Search by username OR nome
        .limit(10);

    if (error) {
        console.error('Error searching corretores:', error);
        throw error;
    }
    
    return data.map(c => ({
        ID_Corretor: c.id,
        Nome: c.nome,
        CRECI: c.creci,
        Cidade: c.cidade,
        Estado: c.estado,
        avatar_url: c.avatar_url,
        username: c.username,
    }));
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const filePath = `${userId}/${Date.now()}_${file.name}`;
    
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const updateCorretor = async (corretorId: string, corretorData: Partial<Omit<Corretor, 'ID_Corretor' | 'Email' | 'CRECI'>>): Promise<void> => {
    const updateData = {
        nome: corretorData.Nome,
        telefone: corretorData.Telefone,
        cidade: corretorData.Cidade,
        estado: corretorData.Estado,
        avatar_url: corretorData.avatar_url,
        whatsapp_notifications_enabled: corretorData.whatsapp_notifications_enabled,
        username: corretorData.username,
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

export const deleteCurrentUserAccount = async (): Promise<void> => {
    const { error } = await supabase.functions.invoke('delete-user');

    if (error) {
        console.error('Error deleting user account:', error);
        throw error;
    }
};

// --- FOLLOWERS ---

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
        console.error('Error checking follow status:', error);
        throw error;
    }

    return !!data;
};

export const followCorretor = async (followerId: string, followingId: string): Promise<void> => {
    const { error } = await supabase
        .from('followers')
        .insert({ follower_id: followerId, following_id: followingId });

    if (error) {
        console.error('Error following corretor:', error);
        throw error;
    }
};

export const unfollowCorretor = async (followerId: string, followingId: string): Promise<void> => {
    const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    if (error) {
        console.error('Error unfollowing corretor:', error);
        throw error;
    }
};

export const getFollowingList = async (corretorId: string): Promise<Partial<Corretor>[]> => {
    const { data, error } = await supabase.rpc('get_following_list', {
        p_corretor_id: corretorId,
    });

    if (error) {
        console.error('Error fetching following list:', error);
        throw error;
    }
    return data.map((c: any) => ({
        ID_Corretor: c.id,
        Nome: c.nome,
        CRECI: c.creci,
        Telefone: c.telefone,
        Cidade: c.cidade,
        Estado: c.estado,
        avatar_url: c.avatar_url,
        username: c.username,
    }));
};