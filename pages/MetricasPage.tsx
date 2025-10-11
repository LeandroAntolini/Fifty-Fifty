import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Metric } from '../types';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { useAuth } from '../hooks/useAuth';
import { brazilianStates, citiesByState } from '../src/utils/brazilianLocations';

type SortCriteria = keyof Omit<Metric, 'ID_Corretor' | 'Nome'>;
type FilterType = 'my_city' | 'my_state' | 'brasil' | 'other_city';

const MetricasPage: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortCriteria, setSortCriteria] = useState<SortCriteria>('Parcerias_Concluidas');
    const [filterType, setFilterType] = useState<FilterType>('my_city');
    
    // State for 'other_city' filter
    const [filterState, setFilterState] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [citiesForFilter, setCitiesForFilter] = useState<string[]>([]);

    const fetchMetrics = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let cidade: string | undefined = undefined;
            let estado: string | undefined = undefined;

            if (filterType === 'my_city') {
                cidade = user.corretorInfo.Cidade;
                estado = user.corretorInfo.Estado;
            } else if (filterType === 'my_state') {
                estado = user.corretorInfo.Estado;
            } else if (filterType === 'other_city' && filterCity && filterState) {
                cidade = filterCity;
                estado = filterState;
            }
            
            // Only fetch if the required params are present for 'other_city'
            if (filterType === 'other_city' && !filterCity) {
                setMetrics([]);
                setLoading(false);
                return;
            }

            const data = await api.getMetricas(cidade, estado);
            setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            toast.error(`Não foi possível carregar as métricas.`);
        } finally {
            setLoading(false);
        }
    }, [user, filterType, filterCity, filterState]);

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
        return [...metrics].sort((a, b) => b[sortCriteria] - a[sortCriteria]);
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
        return value.toString();
    };

    const getMetricLabel = (criteria: SortCriteria) => {
        const labels: { [key in SortCriteria]: string } = {
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
        { label: 'Parcerias Concluídas', value: 'Parcerias_Concluidas' },
        { label: 'Imóveis Adicionados', value: 'Imoveis_Adicionados' },
        { label: 'Clientes Adicionados', value: 'Clientes_Adicionados' },
        { label: 'Matches Iniciados', value: 'Matches_Iniciados' },
        { label: 'Conversas Iniciadas', value: 'Conversas_Iniciadas' },
        { label: 'Taxa de Conversão', value: 'Taxa_Conversao' },
    ];

    const renderMetricCard = (metric: Metric, rank: number) => (
        <div key={metric.ID_Corretor} className={`p-4 rounded-lg shadow ${metric.ID_Corretor === user?.id ? 'bg-secondary/20 border-2 border-secondary' : 'bg-white'}`}>
            <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold text-secondary">{rank}º</div>
                <div>
                    <p className="font-bold text-lg">{metric.Nome}</p>
                    <p className="text-sm text-green-600 font-semibold">
                        {getMetricDisplayValue(metric, sortCriteria)} {getMetricLabel(sortCriteria)}
                    </p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-neutral-dark">
                <p>Imóveis: <span className={`font-semibold ${sortCriteria === 'Imoveis_Adicionados' ? 'text-primary' : ''}`}>{metric.Imoveis_Adicionados}</span></p>
                <p>Clientes: <span className={`font-semibold ${sortCriteria === 'Clientes_Adicionados' ? 'text-primary' : ''}`}>{metric.Clientes_Adicionados}</span></p>
                <p>Matches: <span className={`font-semibold ${sortCriteria === 'Matches_Iniciados' ? 'text-primary' : ''}`}>{metric.Matches_Iniciados}</span></p>
                <p>Conversas: <span className={`font-semibold ${sortCriteria === 'Conversas_Iniciadas' ? 'text-primary' : ''}`}>{metric.Conversas_Iniciadas}</span></p>
                <p>Parcerias: <span className={`font-semibold ${sortCriteria === 'Parcerias_Concluidas' ? 'text-primary' : ''}`}>{metric.Parcerias_Concluidas}</span></p>
                <p>Conversão: <span className={`font-semibold ${sortCriteria === 'Taxa_Conversao' ? 'text-primary' : ''}`}>{(metric.Taxa_Conversao * 100).toFixed(1)}%</span></p>
            </div>
        </div>
    );

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-primary mb-4">Ranking de Corretores</h2>
            
            <div className="mb-4 bg-white p-4 rounded-lg shadow space-y-4">
                <div>
                    <Label htmlFor="ranking-filter">Filtrar ranking por</Label>
                    <Select
                        value={filterType}
                        onValueChange={(value) => setFilterType(value as FilterType)}
                    >
                        <SelectTrigger id="ranking-filter">
                            <SelectValue placeholder="Selecione um filtro" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="my_city">Minha Cidade</SelectItem>
                            <SelectItem value="my_state">Meu Estado</SelectItem>
                            <SelectItem value="brasil">Brasil</SelectItem>
                            <SelectItem value="other_city">Outra Cidade</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {filterType === 'other_city' && (
                    <div className="space-y-2 border-t pt-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="filter-state">Estado</Label>
                            <Select name="Estado" value={filterState} onValueChange={(value) => { setFilterState(value); setFilterCity(''); }} required>
                                <SelectTrigger id="filter-state"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
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
                                <SelectTrigger id="filter-city"><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                                <SelectContent>
                                    {citiesForFilter.map(city => (
                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <div>
                    <Label htmlFor="metricas-sort">Ordenar por</Label>
                    <Select
                        value={sortCriteria}
                        onValueChange={(value) => setSortCriteria(value as SortCriteria)}
                    >
                        <SelectTrigger id="metricas-sort">
                            <SelectValue placeholder="Selecione uma métrica" />
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
            </div>

            {top10Metrics.map((metric, index) => renderMetricCard(metric, index + 1))}

            {!isCurrentUserInTop10 && currentUserMetric && currentUserRank && (
                <>
                    <div className="text-center text-gray-500 my-4">...</div>
                    {renderMetricCard(currentUserMetric, currentUserRank)}
                </>
            )}
        </div>
    );
};

export default MetricasPage;