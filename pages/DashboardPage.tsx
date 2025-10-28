import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Spinner from '../components/Spinner';
import { ImovelStatus, ClienteStatus, MatchStatus } from '../types';
import { Home, User, ThumbsUp, Handshake, PlusCircle, Users, Building, Briefcase, Award, Heart, UserPlus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  imoveisAtivos: number;
  clientesAtivos: number;
  matchesAbertos: number;
  parceriasConcluidas: number;
  seguidores: number;
  seguindo: number;
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
      const [imoveis, clientes, matches, parcerias, metrics, following] = await Promise.all([
        api.getImoveisByCorretor(user.id),
        api.getClientesByCorretor(user.id),
        api.getAugmentedMatchesByCorretor(user.id),
        api.getAugmentedParceriasByCorretor(user.id),
        api.getMetricas(user.corretorInfo.Cidade, user.corretorInfo.Estado, null), // Hall da Fama para Seguidores
        api.getFollowingList(user.id),
      ]);

      const userMetrics = metrics.find(m => m.ID_Corretor === user.id);

      setStats({
        imoveisAtivos: imoveis.filter(i => i.Status === ImovelStatus.Ativo).length,
        clientesAtivos: clientes.filter(c => c.Status === ClienteStatus.Ativo).length,
        matchesAbertos: matches.filter(m => m.Status === MatchStatus.Aberto).length,
        parceriasConcluidas: parcerias.length,
        seguidores: userMetrics?.Seguidores || 0,
        seguindo: following.length,
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
  
  const handleSearchCorretor = () => {
    navigate('/search-corretor');
  };

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-base font-semibold">Suas Métricas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 grid grid-cols-3 gap-2 text-center">
          <Link to="/imoveis" className="p-1 rounded-lg bg-neutral-light hover:bg-gray-200 transition-colors">
            <Home className="mx-auto text-[#9dba8c]" size={20} />
            <p className="text-lg font-bold">{stats?.imoveisAtivos}</p>
            <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
          </Link>
          <Link to="/clientes" className="p-1 rounded-lg bg-neutral-light hover:bg-gray-200 transition-colors">
            <User className="mx-auto text-[#9dba8c]" size={20} />
            <p className="text-lg font-bold">{stats?.clientesAtivos}</p>
            <p className="text-xs text-muted-foreground">Clientes Ativos</p>
          </Link>
          <Link to="/matches" className="p-1 rounded-lg bg-neutral-light hover:bg-gray-200 transition-colors">
            <ThumbsUp className="mx-auto text-[#9dba8c]" size={20} />
            <p className="text-lg font-bold">{stats?.matchesAbertos}</p>
            <p className="text-xs text-muted-foreground">Matches Abertos</p>
          </Link>
          <Link to="/conexoes" className="p-1 rounded-lg bg-neutral-light hover:bg-gray-200 transition-colors">
            <Handshake className="mx-auto text-[#9dba8c]" size={20} />
            <p className="text-lg font-bold">{stats?.parceriasConcluidas}</p>
            <p className="text-xs text-muted-foreground">Parcerias</p>
          </Link>
          <Link to="/conexoes?tab=seguindo" className="p-1 rounded-lg bg-neutral-light hover:bg-gray-200 transition-colors">
            <Heart className="mx-auto text-[#9dba8c]" size={20} />
            <p className="text-lg font-bold">{stats?.seguindo}</p>
            <p className="text-xs text-muted-foreground">Seguindo</p>
          </Link>
          <Link to="/conexoes?tab=seguidores" className="p-1 rounded-lg bg-neutral-light hover:bg-gray-200 transition-colors">
            <UserPlus className="mx-auto text-[#9dba8c]" size={20} />
            <p className="text-lg font-bold">{stats?.seguidores}</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 grid grid-cols-3 gap-2">
          <Button onClick={handleAddImovel} className="w-full" variant="light-outline">
            <PlusCircle className="mr-2" size={18} /> Imóvel
          </Button>
          <Button onClick={handleAddCliente} className="w-full" variant="light-outline">
            <PlusCircle className="mr-2" size={18} /> Cliente
          </Button>
          <Button onClick={handleSearchCorretor} className="w-full" variant="light-outline">
            <Search className="mr-2" size={18} /> Buscar @..
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-base font-semibold">Osteopatia - Leandro Antolini</CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <a 
            href="https://www.instagram.com/osteopatia.leandro.antolini/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="bg-neutral-light rounded-lg flex items-center justify-center min-h-[120px] overflow-hidden">
              <img 
                src="/ad_osteopatia.webp" 
                alt="Espaço Publicitário: Osteopatia Leandro Antolini" 
                className="w-full h-full object-cover"
              />
            </div>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-base font-semibold">Estatísticas da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 grid grid-cols-2 gap-2 text-center">
          {loadingPlatformStats || !platformStats ? (
            <div className="col-span-2 flex justify-center items-center h-24">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="p-1 rounded-lg bg-neutral-light">
                <Users className="mx-auto text-secondary" size={20} />
                <p className="text-lg font-bold">{platformStats.total_corretores}</p>
                <p className="text-xs text-muted-foreground">Corretores</p>
              </div>
              <div className="p-1 rounded-lg bg-neutral-light">
                <Building className="mx-auto text-secondary" size={20} />
                <p className="text-lg font-bold">{platformStats.total_imoveis_ativos}</p>
                <p className="text-xs text-muted-foreground">Imóveis Ativos</p>
              </div>
              <div className="p-1 rounded-lg bg-neutral-light">
                <Briefcase className="mx-auto text-secondary" size={20} />
                <p className="text-lg font-bold">{platformStats.total_clientes_ativos}</p>
                <p className="text-xs text-muted-foreground">Clientes Ativos</p>
              </div>
              <div className="p-1 rounded-lg bg-neutral-light">
                <Award className="mx-auto text-secondary" size={20} />
                <p className="text-lg font-bold">{platformStats.total_parcerias}</p>
                <p className="text-xs text-muted-foreground">Parcerias</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;