import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Metric } from '../types';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { toTitleCase } from '../src/utils/formatters';

type SortCriteria = keyof Omit<Metric, 'ID_Corretor' | 'Nome'>;
type FilterType = 'cidade' | 'estado' | 'brasil';

const MetricasPage: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortCriteria, setSortCriteria] = useState<SortCriteria>('Parcerias_Concluidas');
    const [filterType, setFilterType] = useState<FilterType>('cidade');
    const [cityInput, setCityInput] = useState('');

    useEffect(() => {
        if (user && filterType === 'cidade' && !cityInput) {
            setCityInput(user.corretorInfo.Cidade);
        }
    }, [user, filterType, cityInput]);

    const fetchMetrics = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const apiFilters: { cidade?: string; estado?: string } = {};
            if (filterType === 'cidade' && cityInput) {
                apiFilters.cidade = cityInput;
            } else if (filterType === 'estado') {
                apiFilters.estado = user.corretorInfo.Estado;
            }
            const data = await api.getMetricas(apiFilters);
            setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            toast.error(`Não foi possível carregar as métricas.`);
        } finally {
            setLoading(false);
        }
    }, [user, filterType, cityInput]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const displayMetrics = useMemo(() => {
        if (!user) return [];

        const allSorted = [...metrics].sort((a, b) => b[sortCriteria] - a[sortCriteria]);
        
        const userIndex = allSorted.findIndex(m => m.ID_Corretor === user.id);
        const userMetric = userIndex !== -1 ? { ...allSorted[userIndex], rank: userIndex + 1 } : null;

        const top10 = allSorted.slice(0, 10).map((metric, index) => ({ ...metric, rank: index + 1 }));
        
        const userIsInTop10 = userIndex !== -1 && userIndex < 10;

        if (!userIsInTop10 && userMetric) {
            return [...top10, userMetric];
        }
        
        return top10;
    }, [metrics, sortCriteria, user]);

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

    const filterOptions: { label: string; value: FilterType }[] = [
        { label: 'Cidade', value: 'cidade' },
        { label: 'Estado', value: 'estado' },
        { label: 'Brasil', value: 'brasil' },
    ];

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-primary mb-4">Ranking de Corretores</h2>
            
            <div className="mb-4 bg-white p-4 rounded-lg shadow space-y-4">
                <div>
                    <Label htmlFor="location-filter">Filtrar ranking por</Label>
                    <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                        <SelectTrigger id="location-filter">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {filterOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {filterType === 'cidade' && (
                        <Input
                            type="text"
                            placeholder="Digite o nome da cidade"
                            value={cityInput}
                            onChange={(e) => setCityInput(toTitleCase(e.target.value))}
                            className="mt-2"
                        />
                    )}
                </div>
                <div>
                    <Label htmlFor="metricas-sort">Ordenar por</Label>
                    <Select value={sortCriteria} onValueChange={(value) => setSortCriteria(value as SortCriteria)}>
                        <SelectTrigger id="metricas-sort">
                            <SelectValue />
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

            {displayMetrics.map((metric, index) => (
                <React.Fragment key={metric.ID_Corretor}>
                    {index === 10 && (
                        <div className="text-center my-4">
                            <div className="border-t border-gray-200 w-full"></div>
                            <span className="bg-neutral-light px-2 text-sm text-gray-500 -mt-3 inline-block">Sua Posição</span>
                        </div>
                    )}
                    <div className={`p-4 rounded-lg shadow ${metric.ID_Corretor === user?.id ? 'bg-secondary/20 border border-secondary' : 'bg-white'}`}>
                        <div className="flex items-center space-x-4">
                            <div className="text-2xl font-bold text-secondary">{metric.rank}º</div>
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
                </React.Fragment>
            ))}
            {displayMetrics.length === 0 && !loading && (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhum corretor encontrado para este filtro.</p>
                </div>
            )}
        </div>
    );
};

export default MetricasPage;