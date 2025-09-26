import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { MatchStatus } from '../types';

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
}

const statusTextMap: { [key in MatchStatus]: string } = {
    [MatchStatus.Aberto]: 'Aberto',
    [MatchStatus.Convertido]: 'Convertido',
    [MatchStatus.Fechado]: 'Fechado',
    [MatchStatus.ConclusaoPendente]: 'Pendente',
    [MatchStatus.FechamentoPendente]: 'Pendente',
};

const MatchesPage: React.FC = () => {
    const { user } = useAuth();
    const [matches, setMatches] = useState<AugmentedMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<MatchStatus>(MatchStatus.Aberto);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const fetchMatches = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const matchesData = await api.getAugmentedMatchesByCorretor(user.corretorInfo.ID_Corretor);
            setMatches(matchesData || []);
        } catch (error) {
            console.error("Failed to fetch matches", error);
            toast.error("Não foi possível carregar os matches.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const filteredMatches = useMemo(() => {
        if (statusFilter === MatchStatus.Aberto) {
            return matches.filter(match => 
                match.Status === MatchStatus.Aberto || 
                match.Status === MatchStatus.ConclusaoPendente ||
                match.Status === MatchStatus.FechamentoPendente
            );
        }
        return matches.filter(match => match.Status === statusFilter);
    }, [matches, statusFilter]);

    const getStatusColor = (status: MatchStatus) => {
        switch (status) {
            case MatchStatus.Aberto: return 'bg-blue-500';
            case MatchStatus.Convertido: return 'bg-accent';
            case MatchStatus.Fechado: return 'bg-gray-500';
            case MatchStatus.ConclusaoPendente: return 'bg-yellow-500';
            case MatchStatus.FechamentoPendente: return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-center space-x-2 mb-4 bg-white p-2 rounded-lg shadow">
                <Button size="sm" variant={statusFilter === MatchStatus.Aberto ? 'default' : 'ghost'} onClick={() => setStatusFilter(MatchStatus.Aberto)}>Abertos</Button>
                <Button size="sm" variant={statusFilter === MatchStatus.Convertido ? 'default' : 'ghost'} onClick={() => setStatusFilter(MatchStatus.Convertido)}>Convertidos</Button>
                <Button size="sm" variant={statusFilter === MatchStatus.Fechado ? 'default' : 'ghost'} onClick={() => setStatusFilter(MatchStatus.Fechado)}>Fechados</Button>
            </div>

            {filteredMatches.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhum match encontrado com o status "{statusTextMap[statusFilter]}".</p>
                </div>
            ) : (
                filteredMatches.map(match => {
                    const isMyImovel = match.imovel_id_corretor === user?.corretorInfo.ID_Corretor;
                    return (
                        <div key={match.ID_Match} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {isMyImovel ? `Seu imóvel com cliente de ${match.other_corretor_name}` : `Seu cliente com imóvel de ${match.other_corretor_name}`}
                                    </p>
                                    <h3 className="font-bold text-lg text-primary">{match.imovel_tipo} - {match.imovel_bairro}</h3>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full text-white capitalize ${getStatusColor(match.Status)}`}>{statusTextMap[match.Status]}</span>
                            </div>
                            <div className="mt-2 text-sm text-neutral-dark space-y-1">
                                <p><span className="font-semibold">Imóvel:</span> {match.imovel_dormitorios} dorms, {formatCurrency(match.imovel_valor)}</p>
                                <p><span className="font-semibold">Cliente busca:</span> {match.cliente_dormitorios_minimos}+ dorms, até {formatCurrency(match.cliente_faixa_valor_max)}</p>
                            </div>
                            <Link to={`/matches/${match.ID_Match}/chat`}>
                                <button className="mt-4 w-full bg-secondary hover:bg-amber-500 text-primary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                    {match.Status === MatchStatus.Aberto ? 'Abrir Chat' : 'Ver Histórico'}
                                </button>
                            </Link>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MatchesPage;