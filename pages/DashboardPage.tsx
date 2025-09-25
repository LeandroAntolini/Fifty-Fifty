import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import { useNotifications } from '../contexts/NotificationContext';
import * as api from '../services/api';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Spinner from '../components/Spinner';
import { ImovelStatus, ClienteStatus, MatchStatus } from '../types';
import { Home, User, ThumbsUp, Handshake, PlusCircle, BarChart2, Bell, Users, Building, Briefcase, Award } from 'lucide-react';

interface DashboardStats {
  imoveisAtivos: number;
  clientesAtivos: number;
  matchesAbertos: number;
  parceriasConcluidas: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { openImovelModal, openClienteModal } = useUI();
  const { notificationCount } = useNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platformStats, setPlatformStats] = useState<api.PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [imoveis, clientes, matches, parcerias, platformData] = await Promise.all([
        api.getImoveisByCorretor(user.id),
        api.getClientesByCorretor(user.id),
        api.getAugmentedMatchesByCorretor(user.id),
        api.getAugmentedParceriasByCorretor(user.id),
        api.getPlatformStats(),
      ]);

      setStats({
        imoveisAtivos: imoveis.filter(i => i.Status === ImovelStatus.Ativo).length,
        clientesAtivos: clientes.filter(c => c.Status === ClienteStatus.Ativo).length,
        matchesAbertos: matches.filter(m => m.Status === MatchStatus.Aberto).length,
        parceriasConcluidas: parcerias.length,
      });
      setPlatformStats(platformData);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading || !stats || !platformStats) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Olá, {user?.corretorInfo.Nome.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Bem-vindo(a) de volta.</p>
      </div>

      {notificationCount > 0 && (
        <Link to="/matches">
          <Card className="bg-secondary border-amber-500 hover:bg-amber-300 transition-colors">
            <CardContent className="p-4 flex items-center space-x-4">
              <Bell className="text-secondary-foreground" size={24} />
              <div>
                <p className="font-bold text-secondary-foreground">Você tem {notificationCount} nova(s) notificação(ões)!</p>
                <p className="text-sm text-secondary-foreground/80">Novos matches ou mensagens esperam por você.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suas Métricas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
          <div className="p-2 rounded-lg bg-neutral-light">
            <Home className="mx-auto text-primary" />
            <p className="text-2xl font-bold">{stats.imoveisAtivos}</p>
            <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <User className="mx-auto text-primary" />
            <p className="text-2xl font-bold">{stats.clientesAtivos}</p>
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <ThumbsUp className="mx-auto text-primary" />
            <p className="text-2xl font-bold">{stats.matchesAbertos}</p>
            <p className="text-sm text-muted-foreground">Matches Abertos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <Handshake className="mx-auto text-primary" />
            <p className="text-2xl font-bold">{stats.parceriasConcluidas}</p>
            <p className="text-sm text-muted-foreground">Parcerias</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
          <div className="p-2 rounded-lg bg-neutral-light">
            <Users className="mx-auto text-secondary" />
            <p className="text-2xl font-bold">{platformStats.total_corretores}</p>
            <p className="text-sm text-muted-foreground">Corretores</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <Building className="mx-auto text-secondary" />
            <p className="text-2xl font-bold">{platformStats.total_imoveis_ativos}</p>
            <p className="text-sm text-muted-foreground">Imóveis Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <Briefcase className="mx-auto text-secondary" />
            <p className="text-2xl font-bold">{platformStats.total_clientes_ativos}</p>
            <p className="text-sm text-muted-foreground">Clientes Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <Award className="mx-auto text-secondary" />
            <p className="text-2xl font-bold">{platformStats.total_parcerias}</p>
            <p className="text-sm text-muted-foreground">Parcerias</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={openImovelModal} className="w-full justify-start" variant="ghost">
            <PlusCircle className="mr-2" size={20} /> Adicionar Novo Imóvel
          </Button>
          <Button onClick={openClienteModal} className="w-full justify-start" variant="ghost">
            <PlusCircle className="mr-2" size={20} /> Adicionar Novo Cliente
          </Button>
          <Link to="/metricas">
            <Button className="w-full justify-start" variant="ghost">
              <BarChart2 className="mr-2" size={20} /> Ver Ranking de Corretores
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;