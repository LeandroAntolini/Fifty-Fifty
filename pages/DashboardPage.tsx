import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import { useNotifications } from '../contexts/NotificationContext';
import * as api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Spinner from '../components/Spinner';
import { ImovelStatus, ClienteStatus, MatchStatus } from '../types';
import { Home, User, ThumbsUp, Handshake, PlusCircle, BarChart2, Bell, Users, Building, Briefcase, Award, ChevronRight } from 'lucide-react';

interface DashboardStats {
  imoveisAtivos: number;
  clientesAtivos: number;
  matchesAbertos: number;
  parceriasConcluidas: number;
}

interface AugmentedMatch {
    ID_Match: string;
    Status: MatchStatus;
    imovel_tipo: string;
    imovel_bairro: string;
    other_corretor_name: string;
    imovel_id_corretor: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { openImovelModal, openClienteModal } = useUI();
  const { notificationCount } = useNotifications();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platformStats, setPlatformStats] = useState<api.PlatformStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<AugmentedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const [imoveis, clientes, allMatches, parcerias, platformData] = await Promise.all([
        api.getImoveisByCorretor(user.id),
        api.getClientesByCorretor(user.id),
        api.getAugmentedMatchesByCorretor(user.id),
        api.getAugmentedParceriasByCorretor(user.id),
        api.getPlatformStats(),
      ]);

      setStats({
        imoveisAtivos: imoveis.filter(i => i.Status === ImovelStatus.Ativo).length,
        clientesAtivos: clientes.filter(c => c.Status === ClienteStatus.Ativo).length,
        matchesAbertos: allMatches.filter(m => [MatchStatus.Aberto, MatchStatus.ConclusaoPendente, MatchStatus.FechamentoPendente].includes(m.Status)).length,
        parceriasConcluidas: parcerias.length,
      });
      setPlatformStats(platformData);
      setRecentMatches(allMatches.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleAddImovel = () => {
    navigate('/imoveis');
    openImovelModal();
  };

  const handleAddCliente = () => {
    navigate('/clientes');
    openClienteModal();
  };

  if (loading || !stats || !platformStats) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      {notificationCount > 0 && (
        <Link to="/matches">
          <Card className="bg-secondary border-amber-500 hover:bg-amber-300 transition-colors">
            <CardContent className="p-3 flex items-center space-x-3">
              <Bell className="text-secondary-foreground" size={20} />
              <div>
                <p className="font-semibold text-secondary-foreground">Você tem {notificationCount} nova(s) notificação(ões)!</p>
                <p className="text-xs text-secondary-foreground/80">Novos matches ou mensagens esperam por você.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold">Suas Métricas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-neutral-light">
            <Home className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats.imoveisAtivos}</p>
            <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <User className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats.clientesAtivos}</p>
            <p className="text-xs text-muted-foreground">Clientes Ativos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <ThumbsUp className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats.matchesAbertos}</p>
            <p className="text-xs text-muted-foreground">Matches Abertos</p>
          </div>
          <div className="p-2 rounded-lg bg-neutral-light">
            <Handshake className="mx-auto text-primary" size={20} />
            <p className="text-xl font-bold">{stats.parceriasConcluidas}</p>
            <p className="text-xs text-muted-foreground">Parcerias</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Matches Recentes</CardTitle>
            {recentMatches.length > 0 && (
                <Link to="/matches">
                    <Button variant="link" className="p-0 h-auto text-sm">Ver todos</Button>
                </Link>
            )}
        </CardHeader>
        <CardContent className="p-4 pt-2">
            {recentMatches.length > 0 ? (
            <div className="space-y-3">
                {recentMatches.map(match => {
                const isMyImovel = match.imovel_id_corretor === user?.id;
                return (
                    <Link to={`/matches/${match.ID_Match}/chat`} key={match.ID_Match} className="block p-3 rounded-lg bg-neutral-light hover:bg-neutral-DEFAULT transition-colors">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{match.imovel_tipo} em {match.imovel_bairro}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {isMyImovel ? `Cliente de ${match.other_corretor_name}` : `Imóvel de ${match.other_corretor_name}`}
                        </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                    </Link>
                );
                })}
            </div>
            ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Você ainda não tem nenhum match.</p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold">Estatísticas da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2 text-center">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2">
          <Button onClick={handleAddImovel} className="w-full justify-start h-9" variant="ghost">
            <PlusCircle className="mr-2" size={18} /> Adicionar Novo Imóvel
          </Button>
          <Button onClick={handleAddCliente} className="w-full justify-start h-9" variant="ghost">
            <PlusCircle className="mr-2" size={18} /> Adicionar Novo Cliente
          </Button>
          <Link to="/metricas">
            <Button className="w-full justify-start h-9" variant="ghost">
              <BarChart2 className="mr-2" size={18} /> Ver Ranking de Corretores
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;