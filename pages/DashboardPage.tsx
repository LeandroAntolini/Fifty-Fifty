import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Spinner from '../components/Spinner';
import { ImovelStatus, ClienteStatus, MatchStatus } from '../types';
import { Home, User, ThumbsUp, Handshake, PlusCircle, BarChart2, Users, Building, Briefcase, Award } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  imoveisAtivos: number;
  clientesAtivos: number;
  matchesAbertos: number;
  parceriasConcluidas: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { openImovelModal, openClienteModal } = useUI();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platformStats, setPlatformStats] = useState<api.PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlatformStats, setLoadingPlatformStats] = useState(true);
  const navigate = useNavigate();

  const fetchPersonalStats = useCallback(async () => {
    if (!user) return;
    try {
      const [imoveis, clientes, matches, parcerias] = await Promise.all([
        api.getImoveisByCorretor(user.id),
        api.getClientesByCorretor(user.id),
        api.getAugmentedMatchesByCorretor(user.id),
        api.getAugmentedParceriasByCorretor(user.id),
      ]);

      setStats({
        imoveisAtivos: imoveis.filter(i => i.Status === ImovelStatus.Ativo).length,
        clientesAtivos: clientes.filter(c => c.Status === ClienteStatus.Ativo).length,
        matchesAbertos: matches.filter(m => m.Status === MatchStatus.Aberto).length,
        parceriasConcluidas: parcerias.length,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPersonalStats();
  }, [fetchPersonalStats]);

  useEffect(() => {
    const fetchPlatformStatsData = async () => {
      setLoadingPlatformStats(true);
      try {
        const platformData = await api.getPlatformStats();
        setPlatformStats(platformData);
      } catch (error) {
        console.error("Failed to fetch platform stats", error);
        toast.error("Falha ao carregar estatísticas da plataforma.");
      } finally {
        setLoadingPlatformStats(false);
      }
    };

    fetchPlatformStatsData();
  }, []);

  const handleAddImovel = () => {
    navigate('/imoveis');
    openImovelModal();
  };

  const handleAddCliente = () => {
    navigate('/clientes');
    openClienteModal();
  };

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold">Suas Métricas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-neutral-light">
            <Home className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats?.imoveisAtivos}</p>
            <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <User className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats?.clientesAtivos}</p>
            <p className="text-xs text-muted-foreground">Clientes Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <ThumbsUp className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats?.matchesAbertos}</p>
            <p className="text-xs text-muted-foreground">Matches Abertos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <Handshake className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats?.parceriasConcluidas}</p>
            <p className="text-xs text-muted-foreground">Parcerias</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold">Estatísticas da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2 text-center">
          {loadingPlatformStats || !platformStats ? (
            <div className="col-span-2 flex justify-center items-center h-24">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-neutral-light">
                <Users className="mx-auto text-secondary" size={20} />
                <p className="text-xl font-bold">{platformStats.total_corretores}</p>
                <p className="text-xs text-muted-foreground">Corretores</p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-light">
                <Building className="mx-auto text-secondary" size={20} />
                <p className="text-xl font-bold">{platformStats.total_imoveis_ativos}</p>
                <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-light">
                <Briefcase className="mx-auto text-secondary" size={20} />
                <p className="text-xl font-bold">{platformStats.total_clientes_ativos}</p>
                <p className="text-xs text-muted-foreground">Clientes Ativos</p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-light">
                <Award className="mx-auto text-secondary" size={20} />
                <p className="text-xl font-bold">{platformStats.total_parcerias}</p>
                <p className="text-xs text-muted-foreground">Parcerias</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <Button onClick={handleAddImovel} className="w-full justify-start h-9" variant="ghost">
              <PlusCircle className="mr-2" size={18} /> Adicionar Imóvel
            </Button>
            <Button onClick={handleAddCliente} className="w-full justify-start h-9" variant="ghost">
              <PlusCircle className="mr-2" size={18} /> Adicionar Cliente
            </Button>
            <Link to="/metricas">
              <Button className="w-full justify-start h-9" variant="ghost">
                <BarChart2 className="mr-2" size={18} /> Ver Ranking
              </Button>
            </Link>
          </div>
          <div className="bg-neutral-light rounded-lg flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center p-2">Espaço Publicitário</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;