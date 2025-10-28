import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, Building, Briefcase, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PlatformStatsPage: React.FC = () => {
    const { user } = useAuth();
    const [globalStats, setGlobalStats] = useState<api.PlatformStats | null>(null);
    const [stateStats, setStateStats] = useState<api.PlatformStats | null>(null);
    const [cityStats, setCityStats] = useState<api.PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPlatformStatsData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [globalData, stateData, cityData] = await Promise.all([
                api.getPlatformStats(),
                api.getPlatformStats(undefined, user.corretorInfo.Estado),
                api.getPlatformStats(user.corretorInfo.Cidade, user.corretorInfo.Estado)
            ]);
            setGlobalStats(globalData);
            setStateStats(stateData);
            setCityStats(cityData);
        } catch (error) {
            console.error("Failed to fetch platform stats", error);
            toast.error("Falha ao carregar estatísticas da plataforma.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPlatformStatsData();
    }, [fetchPlatformStatsData]);

    const renderStatsCard = (title: string, stats: api.PlatformStats | null) => {
        if (!stats) return null;
        return (
            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg font-bold text-primary">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-neutral-light">
                        <Users className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{stats.total_corretores}</p>
                        <p className="text-xs text-muted-foreground">Corretores</p>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-light">
                        <Building className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{stats.total_imoveis_ativos}</p>
                        <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-light">
                        <Briefcase className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{stats.total_clientes_ativos}</p>
                        <p className="text-xs text-muted-foreground">Clientes Ativos</p>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-light">
                        <Award className="mx-auto text-secondary" size={24} />
                        <p className="text-2xl font-bold mt-1">{stats.total_parcerias}</p>
                        <p className="text-xs text-muted-foreground">Parcerias</p>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    if (!globalStats || !stateStats || !cityStats || !user) {
        return <div className="text-center p-4 text-gray-500">Não foi possível carregar os dados da plataforma.</div>;
    }

    return (
        <div className="space-y-4">
            {renderStatsCard("Estatísticas Globais da Fifty-Fifty", globalStats)}
            {renderStatsCard(`Estatísticas de ${user.corretorInfo.Estado}`, stateStats)}
            {renderStatsCard(`Estatísticas de ${user.corretorInfo.Cidade}`, cityStats)}
        </div>
    );
};

export default PlatformStatsPage;