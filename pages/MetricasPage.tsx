import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Metric } from '../types';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Label } from '../components/ui/Label';

type SortCriteria = keyof Omit<Metric, 'ID_Corretor' | 'Nome'>;

const MetricasPage: React.FC = () => {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortCriteria, setSortCriteria] = useState<SortCriteria>('Parcerias_Concluidas');

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getMetricas();
            setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            toast.error(`Não foi possível carregar as métricas.`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const sortedMetrics = useMemo(() => {
        return [...metrics].sort((a, b) => b[sortCriteria] - a[sortCriteria]);
    }, [metrics, sortCriteria]);

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

    const filterOptions: { label: string; value: SortCriteria }[] = [
        { label: 'Parcerias Concluídas', value: 'Parcerias_Concluidas' },
        { label: 'Imóveis Adicionados', value: 'Imoveis_Adicionados' },
        { label: 'Clientes Adicionados', value: 'Clientes_Adicionados' },
        { label: 'Matches Iniciados', value: 'Matches_Iniciados' },
        { label: 'Conversas Iniciadas', value: 'Conversas_Iniciadas' },
        { label: 'Taxa de Conversão', value: 'Taxa_Conversao' },
    ];

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-primary mb-4">Ranking de Corretores</h2>
            
            <div className="mb-4 bg-white p-4 rounded-lg shadow space-y-2">
                <Label htmlFor="metricas-sort">Ordenar ranking por</Label>
                <Select
                    value={sortCriteria}
                    onValueChange={(value) => setSortCriteria(value as SortCriteria)}
                >
                    <SelectTrigger id="metricas-sort">
                        <SelectValue placeholder="Selecione uma métrica" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {sortedMetrics.map((metric, index) => (
                <div key={metric.ID_Corretor} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-secondary">{index + 1}º</div>
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
            ))}
        </div>
    );
};

export default MetricasPage;