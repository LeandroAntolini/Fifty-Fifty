import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { MatchStatus } from '../types';
import { supabase } from '../src/integrations/supabase/client';
import { useNotifications } from '../contexts/NotificationContext';
import { Lock } from 'lucide-react';

interface AugmentedMatch {
    ID_Match: string;
    Status: MatchStatus;
    Match_Timestamp: string;
    imovel_tipo: string;
    imovel_bairro: string;
    imovel_valor: number;
    imovel_dormitorios: number;
    imovel_id_corretor: string;
    cliente_dormitorios_minimos: number;
    cliente_faixa_valor_max: number;
    other_corretor_name: string;
    viewed_by_corretor_imovel: boolean;
    viewed_by_corretor_cliente: boolean;
    status_change_requester_id: string | null;
    has_messages: boolean;
    cliente_bairro_desejado: string;
    imovel_detalhes_privados?: string;
    cliente_detalhes_privados?: string;
    is_super_match: boolean; // Adicionado
}

const statusTextMap: { [key in MatchStatus]: string } = {
    [MatchStatus.Aberto]: 'Aberto',
    [MatchStatus.Convertido]: 'Convertido',
    [MatchStatus.Fechado]: 'Fechado',
    [MatchStatus.ReaberturaPendente]: 'Pendente',
    [MatchStatus.ChatDireto]: 'Chat Direto', // Adicionado o novo status
};

const MatchesPage: React.FC = () => {
    const { user } = useAuth();
    const { fetchNotifications } = useNotifications();
    const [matches, setMatches] = useState<AugmentedMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<MatchStatus>(MatchStatus.Aberto);
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const fetchMatches = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const matchesData = await api.getAugmentedMatchesByCorretor(user.corretorInfo.ID_Corretor);
            setMatches(matchesData || []);

            const unviewedMatches = matchesData.filter((match: AugmentedMatch) => {
                const isMyImovel = match.imovel_id_corretor === user.corretorInfo.ID_Corretor;
                return (isMyImovel && !match.viewed_by_corretor_imovel) || (!isMyImovel && !match.viewed_by_corretor_cliente);
            });

            if (unviewedMatches.length > 0) {
                await Promise.all(
                    unviewedMatches.map((match: AugmentedMatch) => api.markMatchAsViewed(match.ID_Match, user.id))
                );
                fetchNotifications();
            }
        } catch (error) {
            console.error("Failed to fetch matches", error);
            toast.error("Não foi possível carregar os matches.");
        } finally {
            setLoading(false);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // Real-time subscription for matches
    useEffect(() => {
        if (!user) return;

        const handleMatchChange = () => {
            fetchMatches();
        };

        const matchesAsImovelOwnerChannel = supabase
            .channel(`matches-imovel-owner-for-matchespage-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id_corretor_imovel=eq.${user.id}` }, handleMatchChange)
            .subscribe();

        const matchesAsClienteOwnerChannel = supabase
            .channel(`matches-cliente-owner-for-matchespage-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id_corretor_cliente=eq.${user.id}` }, handleMatchChange)
            .subscribe();

        return () => {
            supabase.removeChannel(matchesAsImovelOwnerChannel);
            supabase.removeChannel(matchesAsClienteOwnerChannel);
        };
    }, [user, fetchMatches]);

    const filteredMatches = useMemo(() => {
        if (statusFilter === MatchStatus.Aberto) {
            // Filtra por status ativo/pendente/chat direto e ordena por is_super_match (já feito no SQL)
            return matches.filter(match => match.Status === MatchStatus.Aberto || match.Status === MatchStatus.ReaberturaPendente || match.Status === MatchStatus.ChatDireto);
        }
        return matches.filter(match => match.Status === statusFilter);
    }, [matches, statusFilter]);

    const getStatusColor = (status: MatchStatus) => {
        switch (status) {
            case MatchStatus.Aberto: return 'bg-blue-500';
            case MatchStatus.Convertido: return 'bg-accent';
            case MatchStatus.Fechado: return 'bg-gray-500';
            case MatchStatus.ReaberturaPendente: return 'bg-yellow-500';
            case MatchStatus.ChatDireto: return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const toggleDetails = (matchId: string) => {
        setExpandedMatchId(prevId => (prevId === matchId ? null : matchId));
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-center space-x-2 mb-4 bg-white p-2 rounded-lg shadow">
                <Button size="sm" variant={statusFilter === MatchStatus.Aberto ? 'default' : 'ghost'} onClick={() => setStatusFilter(MatchStatus.Aberto)}>Ativos</Button>
                <Button size="sm" variant={statusFilter === MatchStatus.Convertido ? 'default' : 'ghost'} onClick={() => setStatusFilter(MatchStatus.Convertido)}>Convertidos</Button>
                <Button size="sm" variant={statusFilter === MatchStatus.Fechado ? 'default' : 'ghost'} onClick={() => setStatusFilter(MatchStatus.Fechado)}>Fechados</Button>
            </div>

            {filteredMatches.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhum match encontrado com o status selecionado.</p>
                </div>
            ) : (
                filteredMatches.map(match => {
                    const isMyImovel = match.imovel_id_corretor === user?.corretorInfo.ID_Corretor;
                    const isChatActive = match.Status === MatchStatus.Aberto || match.Status === MatchStatus.ReaberturaPendente || match.Status === MatchStatus.ChatDireto;
                    const privateDetails = isMyImovel ? match.imovel_detalhes_privados : match.cliente_detalhes_privados;
                    const matchTypeLabel = match.is_super_match ? 'Super Match' : 'Match';
                    const matchTypeColor = match.is_super_match ? 'bg-secondary text-primary font-bold' : 'bg-gray-100 text-gray-600';

                    return (
                        <div key={match.ID_Match} className={`bg-white p-4 rounded-lg shadow ${match.is_super_match ? 'border-2 border-secondary' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${matchTypeColor} mb-1 inline-block`}>
                                        {match.Status === MatchStatus.ChatDireto ? 'Chat Direto' : matchTypeLabel}
                                    </span>
                                    <p className="text-sm text-gray-500">
                                        {match.Status === MatchStatus.ChatDireto ? (
                                            <>Conversa com {match.other_corretor_name}</>
                                        ) : isMyImovel ? (
                                            <>
                                                <span onClick={() => toggleDetails(match.ID_Match)} className="font-bold text-primary underline cursor-pointer">Seu imóvel</span> com cliente de {match.other_corretor_name}
                                            </>
                                        ) : (
                                            <>
                                                <span onClick={() => toggleDetails(match.ID_Match)} className="font-bold text-primary underline cursor-pointer">Seu cliente</span> com imóvel de {match.other_corretor_name}
                                            </>
                                        )}
                                    </p>
                                    <h3 className="font-bold text-lg text-primary">
                                        {match.Status === MatchStatus.ChatDireto 
                                            ? 'Oportunidade de Conexão' 
                                            : `${match.imovel_tipo} - ${match.imovel_bairro}`
                                        }
                                    </h3>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full text-white capitalize ${getStatusColor(match.Status)}`}>{statusTextMap[match.Status]}</span>
                            </div>

                            {expandedMatchId === match.ID_Match && privateDetails && (
                                <div className="mt-2 p-2 bg-neutral-light rounded text-sm text-neutral-dark flex items-start">
                                    <Lock size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">{isMyImovel ? 'Detalhes Privados do Imóvel:' : 'Detalhes Privados do Cliente:'}</p>
                                        <p>{privateDetails}</p>
                                    </div>
                                </div>
                            )}
                            
                            {match.Status !== MatchStatus.ChatDireto && (
                                <div className="mt-2 text-sm text-neutral-dark space-y-1">
                                    <p><span className="font-semibold">Imóvel:</span> {match.imovel_dormitorios} dorms, {formatCurrency(match.imovel_valor)}</p>
                                    <p><span className="font-semibold">Cliente busca:</span> {match.cliente_bairro_desejado && `${match.cliente_bairro_desejado}, `}{match.cliente_dormitorios_minimos}+ dorms, até {formatCurrency(match.cliente_faixa_valor_max)}</p>
                                </div>
                            )}
                            
                            <Link to={`/matches/${match.ID_Match}/chat`}>
                                <Button variant="secondary" className="mt-4 w-full">
                                    {isChatActive ? (match.has_messages ? 'Continuar Chat' : 'Abrir Chat') : 'Ver Histórico'}
                                </Button>
                            </Link>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MatchesPage;