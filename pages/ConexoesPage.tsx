import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Corretor, AugmentedParceriaResult } from '../types';
import { User as UserIcon, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../src/integrations/supabase/client';
import { useNotifications } from '../contexts/NotificationContext';

interface Follower extends Partial<Corretor> {
    follower_id: string;
    follower_name: string;
    created_at: string;
    isFollowingBack: boolean;
}

type ActiveTab = 'parcerias' | 'seguindo' | 'seguidores';

const ConexoesPage: React.FC = () => {
    const { user } = useAuth();
    const { fetchNotifications, generalNotifications } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Inicializa a aba baseada no query parameter 'tab'
    const initialTab = (new URLSearchParams(location.search).get('tab') as ActiveTab) || 'parcerias';
    
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
    const [parcerias, setParcerias] = useState<AugmentedParceriaResult[]>([]);
    const [seguindo, setSeguindo] = useState<Partial<Corretor>[]>([]);
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const fetchFollowers = useCallback(async (currentUserId: string) => {
        try {
            // 1. Buscar todos os seguidores
            const { data: allFollowers, error: followersError } = await supabase
                .from('followers')
                .select('follower_id, created_at, corretor:follower_id(nome, cidade, estado, avatar_url, username)')
                .eq('following_id', currentUserId)
                .order('created_at', { ascending: false });

            if (followersError) throw followersError;

            // 2. Verificar quem o usuário logado já segue de volta
            const followingList = await api.getFollowingList(currentUserId);
            const followingIds = new Set(followingList.map(c => c.ID_Corretor));

            const mappedFollowers: Follower[] = allFollowers.map((f: any) => ({
                follower_id: f.follower_id,
                follower_name: f.corretor.nome,
                created_at: f.created_at,
                isFollowingBack: followingIds.has(f.follower_id),
                ID_Corretor: f.corretor.id,
                Nome: f.corretor.nome,
                Cidade: f.corretor.cidade,
                Estado: f.corretor.estado,
                avatar_url: f.corretor.avatar_url,
                username: f.corretor.username,
            }));

            setFollowers(mappedFollowers);
        } catch (error) {
            console.error("Failed to fetch followers", error);
            toast.error("Não foi possível carregar a lista de seguidores.");
        }
    }, []);

    const fetchData = useCallback(async (currentTab: ActiveTab) => {
        if (!user) return;
        setLoading(true);
        try {
            if (currentTab === 'parcerias') {
                const augmentedData = await api.getAugmentedParceriasByCorretor(user.id);
                setParcerias(augmentedData || []);
                
                // Marcar notificações de status 'convertido' como vistas ao entrar na aba Parcerias
                const convertedMatchIds = generalNotifications
                    .filter(n => n.type === 'match_update' && n.message.includes('concluída com sucesso'))
                    .map(n => n.matchId)
                    .filter((id): id is string => !!id);
                
                if (convertedMatchIds.length > 0) {
                    await Promise.all(convertedMatchIds.map(matchId => 
                        api.markMatchStatusChangeAsViewed(matchId, user.id)
                    ));
                    fetchNotifications();
                }

            } else if (currentTab === 'seguindo') {
                const followingData = await api.getFollowingList(user.id);
                setSeguindo(followingData || []);
            } else if (currentTab === 'seguidores') {
                await fetchFollowers(user.id);
            }
        } catch (error) {
            console.error(`Failed to fetch ${currentTab}`, error);
            toast.error(`Não foi possível carregar ${currentTab === 'parcerias' ? 'as parcerias' : currentTab === 'seguindo' ? 'quem você segue' : 'seus seguidores'}.`);
        } finally {
            setLoading(false);
        }
    }, [user, fetchFollowers, generalNotifications, fetchNotifications]);

    useEffect(() => {
        // Quando o componente monta ou o location.search muda (navegação externa), atualiza a aba
        const tabParam = new URLSearchParams(location.search).get('tab');
        const newTab: ActiveTab = tabParam === 'seguindo' ? 'seguindo' : tabParam === 'seguidores' ? 'seguidores' : 'parcerias';
        setActiveTab(newTab);
    }, [location.search]);

    useEffect(() => {
        // Sempre que activeTab mudar (seja por clique interno ou navegação externa), busca os dados
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const handleUnfollow = async (corretorId: string) => {
        if (!user) return;
        try {
            await api.unfollowCorretor(user.id, corretorId);
            toast.success("Você deixou de seguir o corretor.");
            fetchData(activeTab); // Refresh the list
        } catch (error) {
            toast.error("Não foi possível deixar de seguir.");
        }
    };
    
    const handleFollowBack = async (followerId: string, followerName: string) => {
        if (!user || isActionLoading) return;
        setIsActionLoading(true);
        try {
            await api.followCorretor(user.id, followerId);
            toast.success(`Você começou a seguir ${followerName} de volta!`);
            
            // Marcar a notificação como lida/notificada (para fins de pontuação)
            // CORREÇÃO: O followerId é quem seguiu, user.id é quem foi seguido (followingId)
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

    const renderParcerias = () => (
        <div className="space-y-4">
            {parcerias.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhuma parceria concluída.</p>
                    <p className="text-sm text-gray-400 mt-2">Quando você e outro corretor finalizarem um negócio, a parceria aparecerá aqui.</p>
                </div>
            ) : (
                parcerias.map(parceria => (
                    <div key={parceria.ID_Parceria} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Parceria com {parceria.other_corretor_name}
                                </p>
                                <h3 className="font-bold text-lg text-primary">{parceria.imovel_tipo} - {parceria.imovel_bairro}</h3>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full text-white capitalize bg-accent">{parceria.Status}</span>
                        </div>
                        <div className="mt-2 text-sm text-neutral-dark space-y-1">
                            <p><span className="font-semibold">Imóvel:</span> {parceria.imovel_dormitorios} dorms, {formatCurrency(parceria.imovel_valor)}</p>
                            <p><span className="font-semibold">Data:</span> {new Date(parceria.DataFechamento).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderSeguindo = () => (
        <div className="space-y-2">
            {seguindo.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Você não está seguindo nenhum corretor.</p>
                    <p className="text-sm text-gray-400 mt-2">Use o botão "Seguir" nos chats para adicionar corretores aqui.</p>
                </div>
            ) : (
                seguindo.map(corretor => (
                    <div key={corretor.ID_Corretor} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {corretor.avatar_url ? (
                                <img src={corretor.avatar_url} alt={corretor.Nome} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-500" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-primary">{corretor.Nome}</p>
                                <p className="text-sm text-gray-500">@{corretor.username}</p>
                                <p className="text-xs text-muted-foreground">{corretor.Cidade} - {corretor.Estado}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => corretor.ID_Corretor && handleUnfollow(corretor.ID_Corretor)}>
                                Deixar de Seguir
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
    
    const renderFollowers = () => (
        <div className="space-y-2">
            {followers.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Ninguém está te seguindo ainda.</p>
                </div>
            ) : (
                followers.map((corretor: Follower) => (
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
                                <p className="font-bold text-primary">{corretor.Nome}</p>
                                <p className="text-sm text-gray-500">@{corretor.username}</p>
                                <p className="text-xs text-muted-foreground">{corretor.Cidade} - {corretor.Estado}</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {corretor.isFollowingBack ? (
                                <Button variant="outline" size="sm" disabled>
                                    Seguindo
                                </Button>
                            ) : (
                                <Button 
                                    size="sm" 
                                    onClick={() => handleFollowBack(corretor.follower_id, corretor.Nome || 'Corretor')}
                                    disabled={isActionLoading}
                                >
                                    <Heart size={16} className="mr-1" /> Seguir de Volta
                                </Button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-center space-x-2 bg-white p-2 rounded-lg shadow">
                <Button size="sm" variant={activeTab === 'parcerias' ? 'default' : 'ghost'} onClick={() => setActiveTab('parcerias')}>Parcerias</Button>
                <Button size="sm" variant={activeTab === 'seguindo' ? 'default' : 'ghost'} onClick={() => setActiveTab('seguindo')}>Seguindo</Button>
                <Button size="sm" variant={activeTab === 'seguidores' ? 'default' : 'ghost'} onClick={() => setActiveTab('seguidores')}>Seguidores</Button>
            </div>
            {loading ? (
                <div className="flex justify-center mt-8"><Spinner /></div>
            ) : (
                activeTab === 'parcerias' ? renderParcerias() : activeTab === 'seguindo' ? renderSeguindo() : renderFollowers()
            )}
        </div>
    );
};

export default ConexoesPage;