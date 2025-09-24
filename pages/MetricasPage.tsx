import React, { useState, useEffect, useCallback } from 'react';
import { Metric } from '../types';
import * as api from '../services/api';
import Spinner from '../components/Spinner';

const MetricasPage: React.FC = () => {
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getMetricas();
            setMetrics(data);
        } catch (error) {
            console.error("Failed to fetch metrics", error);
            alert(`Não foi possível carregar as métricas. ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-primary mb-4">Ranking de Corretores</h2>
            {metrics.map((metric, index) => (
                <div key={metric.ID_Corretor} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-secondary">{index + 1}º</div>
                        <div>
                            <p className="font-bold text-lg">{metric.Nome}</p>
                            <p className="text-sm text-green-600 font-semibold">{metric.Parcerias_Concluidas} Parceria(s) Concluída(s)</p>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-neutral-dark">
                        <p>Imóveis: <span className="font-semibold">{metric.Imoveis_Adicionados}</span></p>
                        <p>Clientes: <span className="font-semibold">{metric.Clientes_Adicionados}</span></p>
                        <p>Matches: <span className="font-semibold">{metric.Matches_Iniciados}</span></p>
                        <p>Conversas: <span className="font-semibold">{metric.Conversas_Iniciadas}</span></p>
                        <p className="col-span-2">Conversão: <span className="font-semibold">{(metric.Taxa_Conversao * 100).toFixed(1)}%</span></p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MetricasPage;