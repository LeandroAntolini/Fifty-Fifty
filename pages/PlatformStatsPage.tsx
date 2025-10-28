import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, Building, Briefcase, Award } from 'lucide-react';

const PlatformStatsPage: React.FC = () => {
    const [platformStats, setPlatformStats] = useState<api.PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPlatformStatsData = useCallback(async () => {
        setLoading(true);
        try {
            // Por enquanto, buscamos as estatísticas gerais (sem filtros de cidade/estado)
            const platformData = await api.getPlatformStats();
            setPlatformStats(platformData);
        } catch (error) {
            console.error("Failed to fetch platform stats", error);
            toast.error("Falha ao carregar estatísticas da plataforma.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlatformStatsData();
    }, [fetchPlatformStatsData]);

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    if (!platformStats) {
        return <div className="text-center p-4 text-gray-500">Não foi possível carregar os dados da plataforma.</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">Estatísticas Globais da Fifty-Fifty</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-neutral-light">
                        <Users className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{platformStats.total_corretores}</p>
                        <p className="text-sm text-muted-foreground">Corretores Cadastrados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-light">
                        <Building className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{platformStats.total_imoveis_ativos}</p>
                        <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-light">
                        <Briefcase className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{platformStats.total_clientes_ativos}</p>
                        <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                    </div>
                    <div className="p-3 rounded-lg bg-neutral-light">
                        <Award className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{platformStats.total_parcerias}</p>
                        <p className="text-sm text-muted-foreground">Parcerias Concluídas</p>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">O que estes números significam?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-neutral-dark space-y-3">
                    <p>Estes dados representam o total de corretores, imóveis, clientes e parcerias em toda a plataforma Fifty-Fifty, demonstrando o crescimento e o potencial de conexões em nossa rede.</p>
                    <p>Para ver as métricas de ranking por cidade ou estado, acesse a aba "Ranking".</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlatformStatsPage;