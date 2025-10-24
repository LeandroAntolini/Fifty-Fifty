import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../services/api';
import Spinner from '../../components/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Users, Building, Briefcase, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PlatformStatsPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [brasilStats, setBrasilStats] = useState<api.PlatformStats | null>(null);
    const [stateStats, setStateStats] = useState<api.PlatformStats | null>(null);
    const [cityStats, setCityStats] = useState<api.PlatformStats | null>(null);

    useEffect(() => {
        const fetchAllStats = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [brasil, estado, cidade] = await Promise.all([
                    api.getPlatformStats(),
                    api.getPlatformStats(undefined, user.corretorInfo.Estado),
                    api.getPlatformStats(user.corretorInfo.Cidade, user.corretorInfo.Estado)
                ]);
                setBrasilStats(brasil);
                setStateStats(estado);
                setCityStats(cidade);
            } catch (error) {
                console.error("Failed to fetch platform stats", error);
                toast.error("Falha ao carregar estatísticas.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllStats();
    }, [user]);

    const chartData = [
        { name: 'Sua Cidade', Corretores: cityStats?.total_corretores || 0, Imóveis: cityStats?.total_imoveis_ativos || 0, Parcerias: cityStats?.total_parcerias || 0 },
        { name: `Estado (${user?.corretorInfo.Estado})`, Corretores: stateStats?.total_corretores || 0, Imóveis: stateStats?.total_imoveis_ativos || 0, Parcerias: stateStats?.total_parcerias || 0 },
        { name: 'Brasil', Corretores: brasilStats?.total_corretores || 0, Imóveis: brasilStats?.total_imoveis_ativos || 0, Parcerias: brasilStats?.total_parcerias || 0 },
    ];

    const StatCard = ({ title, stats }: { title: string, stats: api.PlatformStats | null }) => (
        <Card>
            <CardHeader className="p-3 pb-1">
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 grid grid-cols-2 gap-2 text-center">
                {!stats ? (
                    <div className="col-span-2 flex justify-center items-center h-24">
                        <Spinner size="sm" />
                    </div>
                ) : (
                    <>
                        <div className="p-1 rounded-lg bg-neutral-light">
                            <Users className="mx-auto text-secondary" size={20} />
                            <p className="text-lg font-bold">{stats.total_corretores}</p>
                            <p className="text-xs text-muted-foreground">Corretores</p>
                        </div>
                        <div className="p-1 rounded-lg bg-neutral-light">
                            <Building className="mx-auto text-secondary" size={20} />
                            <p className="text-lg font-bold">{stats.total_imoveis_ativos}</p>
                            <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
                        </div>
                        <div className="p-1 rounded-lg bg-neutral-light">
                            <Briefcase className="mx-auto text-secondary" size={20} />
                            <p className="text-lg font-bold">{stats.total_clientes_ativos}</p>
                            <p className="text-xs text-muted-foreground">Clientes Ativos</p>
                        </div>
                        <div className="p-1 rounded-lg bg-neutral-light">
                            <Award className="mx-auto text-secondary" size={20} />
                            <p className="text-lg font-bold">{stats.total_parcerias}</p>
                            <p className="text-xs text-muted-foreground">Parcerias</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-4">
            <StatCard title="Brasil" stats={brasilStats} />
            <StatCard title={`Estado: ${user?.corretorInfo.Estado}`} stats={stateStats} />
            <StatCard title={`Cidade: ${user?.corretorInfo.Cidade}`} stats={cityStats} />

            <Card>
                <CardHeader>
                    <CardTitle>Comparativo</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Corretores" fill="#8884d8" />
                            <Bar dataKey="Imóveis" fill="#82ca9d" />
                            <Bar dataKey="Parcerias" fill="#ffc658" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default PlatformStatsPage;