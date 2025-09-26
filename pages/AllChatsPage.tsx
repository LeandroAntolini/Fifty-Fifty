import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../src/integrations/supabase/client';
import { Button } from '../components/ui/Button';

interface Chat {
    ID_Match: string;
    Other_Corretor_Name: string;
    Imovel_Tipo: string;
    Imovel_Bairro: string;
    Last_Message_Text: string;
    Last_Message_Timestamp: string;
    Unread_Count: number;
    Match_Status?: string;
}

const AllChatsPage: React.FC = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ativas' | 'arquivadas'>('ativas');

    const fetchChats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const chatsData = filter === 'ativas'
                ? await api.getActiveChatsByCorretor(user.corretorInfo.ID_Corretor)
                : await api.getAllChatsByCorretor(user.corretorInfo.ID_Corretor);
            setChats(chatsData || []);
        } catch (error) {
            console.error("Failed to fetch chats", error);
            toast.error("Não foi possível carregar as conversas.");
        } finally {
            setLoading(false);
        }
    }, [user, filter]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        const channel = supabase
            .channel('all-chats-page-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => { fetchChats(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchChats]);

    const formatTimestamp = (timestamp: string) => {
        if (!timestamp) return '';
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
    };

    const getStatusDisplay = (status: string | undefined) => {
        if (!status) return null;
        const statusMap: { [key: string]: { text: string; color: string } } = {
            aberto: { text: 'Ativa', color: 'bg-blue-500' },
            convertido: { text: 'Concluída', color: 'bg-accent' },
            fechado: { text: 'Fechada', color: 'bg-gray-500' },
            reabertura_pendente: { text: 'Pendente', color: 'bg-yellow-500' },
        };
        const display = statusMap[status];
        if (!display) return null;
        return (
            <span className={`text-xs font-bold px-2 py-1 rounded-full text-white capitalize ${display.color}`}>
                {display.text}
            </span>
        );
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-center space-x-2 bg-white p-2 rounded-lg shadow">
                <Button size="sm" variant={filter === 'ativas' ? 'default' : 'ghost'} onClick={() => setFilter('ativas')}>Ativas</Button>
                <Button size="sm" variant={filter === 'arquivadas' ? 'default' : 'ghost'} onClick={() => setFilter('arquivadas')}>Arquivadas</Button>
            </div>

            <div className="space-y-2">
                {chats.length === 0 ? (
                    <div className="text-center p-4 bg-white rounded-lg shadow">
                        <p className="text-gray-600">Nenhuma conversa encontrada.</p>
                        <p className="text-sm text-gray-400 mt-2">
                            {filter === 'ativas'
                                ? 'Quando você iniciar uma conversa em um match, ela aparecerá aqui.'
                                : 'Conversas de matches concluídos ou fechados aparecerão aqui.'}
                        </p>
                    </div>
                ) : (
                    chats.map(chat => (
                        <Link to={`/matches/${chat.ID_Match}/chat`} key={chat.ID_Match} className="block">
                            <div className="bg-white p-4 rounded-lg shadow hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-primary truncate">{chat.Other_Corretor_Name}</p>
                                        <p className="text-sm text-gray-600 truncate">{chat.Imovel_Tipo} em {chat.Imovel_Bairro}</p>
                                    </div>
                                    <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                        {formatTimestamp(chat.Last_Message_Timestamp)}
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate pr-4">
                                        {chat.Last_Message_Text}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        {filter === 'arquivadas' && getStatusDisplay(chat.Match_Status)}
                                        {chat.Unread_Count > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                {chat.Unread_Count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default AllChatsPage;