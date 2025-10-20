import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { User as UserIcon, Heart } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client'; // Importação corrigida

interface Follower {
    follower_id: string;
    follower_name: string;
    created_at: string;
    isFollowingBack: boolean;
}

const FollowersPage: React.FC = () => {
    const { user } = useAuth();
    const { fetchNotifications } = useNotifications();
    const navigate = useNavigate();
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const fetchFollowers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Buscar todos os seguidores
            const { data: allFollowers, error: followersError } = await supabase
                .from('followers')
                .select('follower_id, created_at, corretor:follower_id(nome, cidade, estado, avatar_url, username)')
                .eq('following_id', user.id)
                .order('created_at', { ascending: false });

            if (followersError) throw followersError;

            // 2. Verificar quem o usuário logado já segue de volta
            const followingList = await api.getFollowingList(user.id);
            const followingIds = new Set(followingList.map(c => c.ID_Corretor));

            const mappedFollowers: Follower[] = allFollowers.map((f: any) => ({
                follower_id: f.follower_id,
                follower_name: f.corretor.nome,
                created_at: f.created_at,
                isFollowingBack: followingIds.has(f.follower_id),
                ...f.corretor, // Inclui outros detalhes do corretor
            }));

            setFollowers(mappedFollowers);
        } catch (error) {
            console.error("Failed to fetch followers", error);
            toast.error("Não foi possível carregar a lista de seguidores.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFollowers();
    }, [fetchFollowers]);

    const handleFollowBack = async (followerId: string, followerName: string) => {
        if (!user || isActionLoading) return;
        setIsActionLoading(true);
        try {
            await api.followCorretor(user.id, followerId);
            toast.success(`Você começou a seguir ${followerName} de volta!`);
            
            // Marcar a notificação como lida/notificada (para fins de pontuação)
            await api.markFollowAsNotified(followerId, user.id);
            
            // Atualização otimista e refresh
            setFollowers(prev => prev.map(f => f.follower_id === followerId ? { ...f, isFollowingBack: true } : f));
            fetchNotifications(); // Atualiza o contador de notificações
        } catch (error) {
            toast.error("Falha ao seguir de volta.");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary">Meus Seguidores</h2>
            <p className="text-sm text-gray-600">Corretores que estão te seguindo. Siga de volta para aumentar a prioridade de matches mútuos!</p>
            
            {followers.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Ninguém está te seguindo ainda.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {followers.map((corretor: any) => (
                        <div key={corretor.follower_id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {corretor.avatar_url ? (
                                    <img src={corretor.avatar_url} alt={corretor.Nome} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-gray-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-primary">{corretor.nome}</p>
                                    <p className="text-sm text-gray-500">@{corretor.username}</p>
                                    <p className="text-xs text-muted-foreground">{corretor.cidade} - {corretor.estado}</p>
                                </div>
                            </div>
                            {corretor.isFollowingBack ? (
                                <Button variant="outline" size="sm" disabled>
                                    Seguindo
                                </Button>
                            ) : (
                                <Button 
                                    size="sm" 
                                    onClick={() => handleFollowBack(corretor.follower_id, corretor.nome)}
                                    disabled={isActionLoading}
                                >
                                    <Heart size={16} className="mr-1" /> Seguir de Volta
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FollowersPage;