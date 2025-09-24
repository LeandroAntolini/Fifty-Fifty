import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Match, Imovel, Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';

interface AugmentedMatch extends Match {
  imovel: Imovel | undefined;
  cliente: Cliente | undefined;
  otherCorretorName: string;
}

const MatchesPage: React.FC = () => {
    const { user } = useAuth();
    const [matches, setMatches] = useState<AugmentedMatch[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const fetchMatches = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [
                matchesData,
                imoveisData,
                clientesData,
                metricsData
            ] = await Promise.all([
                // FIX: Passed user.corretorInfo.ID_Corretor to getMatchesByCorretor
                api.getMatchesByCorretor(user.corretorInfo.ID_Corretor),
                api.getImoveis(),
                api.getClientes(),
                api.getMetricas(),
            ]);

            const imoveisMap = new Map(imoveisData.map(i => [i.ID_Imovel, i]));
            const clientesMap = new Map(clientesData.map(c => [c.ID_Cliente, c]));
            const corretoresMap = new Map(metricsData.map(m => [m.ID_Corretor, m.Nome]));

            const augmented = matchesData.map(match => {
                const imovel = imoveisMap.get(match.ID_Imovel);
                const cliente = clientesMap.get(match.ID_Cliente);

                const myId = user.corretorInfo.ID_Corretor;
                const otherCorretorId = match.Corretor_A_ID === myId ? match.Corretor_B_ID : match.Corretor_A_ID;
                const otherCorretorName = corretoresMap.get(otherCorretorId) || 'Corretor Desconhecido';

                return { ...match, imovel, cliente, otherCorretorName };
            }).sort((a, b) => new Date(b.Match_Timestamp).getTime() - new Date(a.Match_Timestamp).getTime());

            setMatches(augmented);

        } catch (error) {
            console.error("Failed to fetch matches", error);
            alert("Não foi possível carregar os matches.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            {matches.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhum match encontrado.</p>
                    <p className="text-sm text-gray-400 mt-2">Quando um imóvel seu combinar com o cliente de outro corretor (ou vice-versa), o match aparecerá aqui.</p>
                </div>
            ) : (
                matches.map(match => {
                    if (!match.imovel || !match.cliente) {
                        // This can happen if an imovel/cliente was deleted but the match remains.
                        return null; 
                    }
                    const isMyImovel = match.imovel.ID_Corretor === user?.corretorInfo.ID_Corretor;
                    return (
                        <div key={match.ID_Match} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {isMyImovel ? `Seu imóvel com cliente de ${match.otherCorretorName}` : `Seu cliente com imóvel de ${match.otherCorretorName}`}
                                    </p>
                                    <h3 className="font-bold text-lg text-primary">{match.imovel.Tipo} - {match.imovel.Bairro}</h3>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full text-white capitalize ${match.Status === 'aberto' ? 'bg-blue-500' : 'bg-gray-500'}`}>{match.Status}</span>
                            </div>
                            <div className="mt-2 text-sm text-neutral-dark space-y-1">
                                <p><span className="font-semibold">Imóvel:</span> {match.imovel.Dormitorios} dorms, {formatCurrency(match.imovel.Valor)}</p>
                                <p><span className="font-semibold">Cliente busca:</span> {match.cliente.DormitoriosMinimos}+ dorms, até {formatCurrency(match.cliente.FaixaValorMax)}</p>
                            </div>
                            <Link to={`/matches/${match.ID_Match}/chat`}>
                                <button className="mt-4 w-full bg-secondary hover:bg-amber-500 text-primary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                    Abrir Chat
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