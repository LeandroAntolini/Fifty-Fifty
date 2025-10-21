import { supabase } from '../src/integrations/supabase/client';
import { Message, ReadStatus } from '../types';

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