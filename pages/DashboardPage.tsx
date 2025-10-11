import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Spinner from '../components/Spinner';
import { ImovelStatus, ClienteStatus, MatchStatus } from '../types';
import { Home, User, ThumbsUp, Handshake, PlusCircle, BarChart2, Users, Building, Briefcase, Award, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { brazilianStates, citiesByState } from '../src/utils/brazilianLocations';
import toast from 'react-hot-toast';

interface DashboardStats {
  imoveisAtivos: number;
  clientesAtivos: number;
  matchesAbertos: number;
  parceriasConcluidas: number;
}

type PlatformFilterScope = 'brasil' | 'estado' | 'cidade';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { openImovelModal, openClienteModal } = useUI();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platformStats, setPlatformStats] = useState<api.PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlatformStats, setLoadingPlatformStats] = useState(true);
  const navigate = useNavigate();

  // Platform stats filters state
  const [filterScope, setFilterScope] = useState<PlatformFilterScope>('cidade');
  const [selectedState, setSelectedState] = useState(user?.corretorInfo.Estado || '');
  const [selectedCity, setSelectedCity] = useState(user?.corretorInfo.Cidade || '');
  const [cities, setCities] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const fetchPlatformStatsData = useCallback(async () => {
    setLoadingPlatformStats(true);
    try {
      let cidade: string | undefined = undefined;
      let estado: string | undefined = undefined;

      if (filterScope === 'cidade' && selectedCity && selectedState) {
        cidade = selectedCity;
        estado = selectedState;
      } else if (filterScope === 'estado' && selectedState) {
        estado = selectedState;
      }

      const platformData = await api.getPlatformStats(cidade, estado);
      setPlatformStats(platformData);
    } catch (error) {
      console.error("Failed to fetch platform stats", error);
      toast.error("Falha ao carregar estatísticas da plataforma.");
    } finally {
      setLoadingPlatformStats(false);
    }
  }, [filterScope, selectedCity, selectedState]);

  useEffect(() => {
    fetchPersonalStats();
  }, [fetchPersonalStats]);

  useEffect(() => {
    fetchPlatformStatsData();
  }, [fetchPlatformStatsData]);

  useEffect(() => {
    if (selectedState) {
      setCities(citiesByState[selectedState] || []);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (user) {
      setSelectedState(user.corretorInfo.Estado);
      setSelectedCity(user.corretorInfo.Cidade);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterRef]);

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
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Estatísticas da Plataforma</CardTitle>
          <div className="relative" ref={filterRef}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFilterOpen(prev => !prev)}>
              <Filter size={16} />
            </Button>
            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20 p-4 space-y-2">
                <div className="space-y-1.5">
                  <Label>Filtrar por</Label>
                  <Select value={filterScope} onValueChange={(v) => setFilterScope(v as PlatformFilterScope)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cidade">Cidade</SelectItem>
                      <SelectItem value="estado">Estado</SelectItem>
                      <SelectItem value="brasil">Brasil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(filterScope === 'estado' || filterScope === 'cidade') && (
                  <div className="space-y-1.5">
                    <Label>Estado</Label>
                    <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setSelectedCity(''); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione o Estado" /></SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map(state => <SelectItem key={state.sigla} value={state.sigla}>{state.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {filterScope === 'cidade' && (
                  <div className="space-y-1.5">
                    <Label>Cidade</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                      <SelectTrigger><SelectValue placeholder="Selecione a Cidade" /></SelectTrigger>
                      <SelectContent>
                        {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
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