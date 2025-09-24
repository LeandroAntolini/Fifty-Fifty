import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActiveChat {
    ID_Match: string;
    Other_Corretor_Name: string;
    Imovel_Tipo: string;
    Imovel_Bairro: string;
    Last_Message_Text: string;
    Last_Message_Timestamp: string;
    Unread_Count: number;
}

const AllChatsPage: React.FC = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState<ActiveChat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const chatsData = await api.getActiveChatsByCorretor(user.corretorInfo.ID_Corretor);
            setChats(chatsData || []);
        } catch (error) {
            console.error("Failed to fetch chats", error);
            toast.error("Não foi possível carregar as conversas.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    const formatTimestamp = (timestamp: string) => {
        if (!timestamp) return '';
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-2">
            {chats.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhuma conversa iniciada.</p>
                    <p className="text-sm text-gray-400 mt-2">Quando você iniciar uma conversa em um match, ela aparecerá aqui.</p>
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
                                {chat.Unread_Count > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {chat.Unread_Count}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))
            )}
        </div>
    );
};

export default AllChatsPage;