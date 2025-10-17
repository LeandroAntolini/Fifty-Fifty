import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Metric } from '../types';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { useAuth } from '../hooks/useAuth';
import { brazilianStates, citiesByState } from '../src/utils/brazilianLocations';
import RankingInfoModal from '../components/RankingInfoModal';
import { startOfMonth, formatISO } from 'date-fns';

type SortCriteria = keyof Omit<Metric, 'ID_Corretor' | 'Nome'>;
type FilterType = 'my_city' | 'my_state' | 'brasil' | 'other_city';
type PeriodType = 'hall_da_fama' | 'mensal';

const MetricasPage: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortCriteria, setSortCriteria] = useState<SortCriteria>('Score');
    const [filterType, setFilterType] = useState<FilterType>('my_city');
    const [periodType, setPeriodType] = useState<PeriodType>('mensal');
    
    const [filterState, setFilterState] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [citiesForFilter, setCitiesForFilter] = useState<string[]>([]);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const fetchMetrics = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let cidade: string | undefined = undefined;
            let estado: string | undefined = undefined;
            let startDate: string | null = null; // Inicializa como null

            if (filterType === 'my_city') {
                cidade = user.corretorInfo.Cidade;
                estado = user.corretorInfo.Estado;
            } else if (filterType === 'my_state') {
                estado = user.corretorInfo.Estado;
            } else if (filterType === 'other_city' && filterCity && filterState) {
                cidade = filterCity;
                estado = filterState;
            }
            
            if (filterType === 'other_city' && !filterCity) {
                setMetrics([]);
                setLoading(false);
                return;
            }

            if (periodType === 'mensal') {
                startDate = formatISO(startOfMonth(new Date()));
            }
            // Se periodType for 'hall_da_fama', startDate permanece null.

            // Passamos null se for Hall da Fama, ou a data formatada se for Mensal.
            const data = await api.getMetricas(cidade, estado, startDate); 
            setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            toast.error(`Não foi possível carregar as métricas.`);
        } finally {
            setLoading(false);
        }
    }, [user, filterType, filterCity, filterState, periodType]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    useEffect(() => {
        if (filterState) {
            setCitiesForFilter(citiesByState[filterState] || []);
        } else {
            setCitiesForFilter([]);
        }
    }, [filterState]);

    useEffect(() => {
        if (filterType !== 'other_city') {
            setFilterState('');
            setFilterCity('');
        }
    }, [filterType]);

    const sortedMetrics = useMemo(() => {
        return [...metrics].sort((a, b) => {
            if (sortCriteria === 'Score') {
                return b.Score - a.Score;
            }
            return b[sortCriteria] - a[sortCriteria];
        });
    }, [metrics, sortCriteria]);

    const top10Metrics = sortedMetrics.slice(0, 10);
    const currentUserMetric = user ? sortedMetrics.find(m => m.ID_Corretor === user.id) : undefined;
    const currentUserRank = currentUserMetric ? sortedMetrics.findIndex(m => m.ID_Corretor === user.id) + 1 : null;
    const isCurrentUserInTop10 = currentUserRank !== null && currentUserRank <= 10;

    const getMetricDisplayValue = (metric: Metric, criteria: SortCriteria) => {
        const value = metric[criteria];
        if (criteria === 'Taxa_Conversao') {
            return `${(value * 100).toFixed(1)}%`;
        }
        if (criteria === 'Score') {
            return `${value} pts`;
        }
        return value.toString();
    };

    const getMetricLabel = (criteria: SortCriteria) => {
        const labels: { [key in SortCriteria]: string } = {
            Score: 'Score Total',
            Parcerias_Concluidas: 'Parceria(s) Concluída(s)',
            Imoveis_Adicionados: 'Imóvel(is) Adicionado(s)',
            Clientes_Adicionados: 'Cliente(s) Adicionado(s)',
            Matches_Iniciados: 'Match(es) Iniciado(s)',
            Conversas_Iniciadas: 'Conversa(s) Iniciada(s)',
            Taxa_Conversao: 'de Conversão',
        };
        return labels[criteria];
    };

    const sortOptions: { label: string; value: SortCriteria }[] = [
        { label: 'Score', value: 'Score' },
        { label: 'Parcerias Concluídas', value: 'Parcerias_Concluidas' },
        { label: 'Imóveis Adicionados', value: 'Imoveis_Adicionados' },
        { label: 'Clientes Adicionados', value: 'Clientes_Adicionados' },
        { label: 'Matches Iniciados', value: 'Matches_Iniciados' },
        { label: 'Conversas Iniciadas', value: 'Conversas_Iniciadas' },
        { label: 'Taxa de Conversão', value: 'Taxa_Conversao' },
    ];

    const renderMetricCard = (metric: Metric, rank: number) => {
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}º`;
        return (
            <div key={metric.ID_Corretor} className={`p-4 rounded-lg shadow ${metric.ID_Corretor === user?.id ? 'bg-secondary/20 border-2 border-secondary' : 'bg-white'}`}>
                <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-secondary">{rankIcon}</div>
                    <div>
                        <p className="font-bold text-lg">{metric.Nome}</p>
                        <p className="text-sm text-green-600 font-semibold">
                            {getMetricDisplayValue(metric, sortCriteria)}
                        </p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-neutral-dark">
                    <p>Score: <span className={`font-semibold ${sortCriteria === 'Score' ? 'text-primary' : ''}`}>{metric.Score}</span></p>
                    <p>Parcerias: <span className={`font-semibold ${sortCriteria === 'Parcerias_Concluidas' ? 'text-primary' : ''}`}>{metric.Parcerias_Concluidas}</span></p>
                    <p>Imóveis: <span className={`font-semibold ${sortCriteria === 'Imoveis_Adicionados' ? 'text-primary' : ''}`}>{metric.Imoveis_Adicionados}</span></p>
                    <p>Clientes: <span className={`font-semibold ${sortCriteria === 'Clientes_Adicionados' ? 'text-primary' : ''}`}>{metric.Clientes_Adicionados}</span></p>
                    <p>Matches: <span className={`font-semibold ${sortCriteria === 'Matches_Iniciados' ? 'text-primary' : ''}`}>{metric.Matches_Iniciados}</span></p>
                    <p>Conversas: <span className={`font-semibold ${sortCriteria === 'Conversas_Iniciadas' ? 'text-primary' : ''}`}>{metric.Conversas_Iniciadas}</span></p>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="text-center p-4 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold text-primary">Ranking de Corretores</h2>
                <p className="text-xs text-neutral-dark mt-1">
                    Veja sua posição e a dos seus colegas com base no Score da plataforma.
                </p>
                <button onClick={() => setIsInfoModalOpen(true)} className="text-sm text-primary hover:underline font-semibold mt-2">
                    Saiba mais sobre a pontuação
                </button>
            </div>
            
            <div className="mb-4 bg-white p-4 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="ranking-period">Período</Label>
                        <Select
                            value={periodType}
                            onValueChange={(value) => setPeriodType(value as PeriodType)}
                        >
                            <SelectTrigger id="ranking-period">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mensal">Mensal (Prêmio)</SelectItem>
                                <SelectItem value="hall_da_fama">Hall da Fama (Total)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="metricas-sort">Ordenar por</Label>
                        <Select
                            value={sortCriteria}
                            onValueChange={(value) => setSortCriteria(value as SortCriteria)}
                        >
                            <SelectTrigger id="metricas-sort">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="ranking-filter">Filtrar por</Label>
                        <Select
                            value={filterType}
                            onValueChange={(value) => setFilterType(value as FilterType)}
                        >
                            <SelectTrigger id="ranking-filter">
                                <SelectValue placeholder="Filtrar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="my_city">Minha Cidade</SelectItem>
                                <SelectItem value="my_state">Meu Estado</SelectItem>
                                <SelectItem value="brasil">Brasil</SelectItem>
                                <SelectItem value="other_city">Outra Cidade</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {filterType === 'other_city' && (
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="filter-state">Estado</Label>
                            <Select name="Estado" value={filterState} onValueChange={(value) => { setFilterState(value); setFilterCity(''); }} required>
                                <SelectTrigger id="filter-state"><SelectValue placeholder="UF" /></SelectTrigger>
                                <SelectContent>
                                    {brazilianStates.map(state => (
                                        <SelectItem key={state.sigla} value={state.sigla}>{state.sigla}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="filter-city">Cidade</Label>
                            <Select name="Cidade" value={filterCity} onValueChange={setFilterCity} required disabled={!filterState}>
                                <SelectTrigger id="filter-city"><SelectValue placeholder="Cidade" /></SelectTrigger>
                                <SelectContent>
                                    {citiesForFilter.map(city => (
                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            {top10Metrics.map((metric, index) => renderMetricCard(metric, index + 1))}

            {!isCurrentUserInTop10 && currentUserMetric && currentUserRank && (
                <>
                    <div className="text-center text-gray-500 my-4">...</div>
                    {renderMetricCard(currentUserMetric, currentUserRank)}
                </>
            )}

            <RankingInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        </div>
    );
};

export default MetricasPage;