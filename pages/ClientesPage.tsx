import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Cliente, ClienteStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddClienteModal from '../components/AddClienteModal';
import { Edit, Trash2, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';
import { Button } from '../components/ui/Button';

type SortCriteria = 'newest' | 'oldest' | 'highest_value' | 'lowest_value';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isClienteModalOpen, openClienteModal, closeClienteModal } = useUI();
  const [findingMatch, setFindingMatch] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Filter and Sort states
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dormitoriosFilter, setDormitoriosFilter] = useState('');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('newest');

  const fetchClientes = useCallback(async () => {
    if (user) {
      try {
        const data = await api.getClientesByCorretor(user.corretorInfo.ID_Corretor);
        setClientes(data);
      } catch (error) {
        console.error("Failed to fetch clientes", error);
        toast.error(`Não foi possível carregar os clientes.`);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchClientes();
  }, [fetchClientes]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`clientes-page-channel-for-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'clientes', filter: `id_corretor=eq.${user.id}` }, () => { fetchClientes(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchClientes]);

  // Close sort menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const areFiltersActive = useMemo(() => {
    return !!(cidadeFilter || bairroFilter || estadoFilter || valorMinFilter || valorMaxFilter || dormitoriosFilter);
  }, [cidadeFilter, bairroFilter, estadoFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter]);

  const clearFilters = () => {
    setCidadeFilter('');
    setBairroFilter('');
    setEstadoFilter('');
    setValorMinFilter('');
    setValorMaxFilter('');
    setDormitoriosFilter('');
  };

  const processedClientes = useMemo(() => {
    const filtered = clientes.filter(cliente => {
      const valorMin = parseFloat(valorMinFilter);
      const valorMax = parseFloat(valorMaxFilter);
      const dormitorios = parseInt(dormitoriosFilter, 10);
      const valorOverlap = (isNaN(valorMin) || cliente.FaixaValorMax >= valorMin) && (isNaN(valorMax) || cliente.FaixaValorMin <= valorMax);
      return ((cidadeFilter === '' || cliente.CidadeDesejada.toLowerCase().includes(cidadeFilter.toLowerCase())) && (bairroFilter === '' || cliente.BairroRegiaoDesejada.toLowerCase().includes(bairroFilter.toLowerCase())) && (estadoFilter === '' || (cliente.EstadoDesejado && cliente.EstadoDesejado.toLowerCase().includes(estadoFilter.toLowerCase()))) && valorOverlap && (isNaN(dormitorios) || cliente.DormitoriosMinimos >= dormitorios));
    });

    return filtered.sort((a, b) => {
      if (a.Status === ClienteStatus.Ativo && b.Status !== ClienteStatus.Ativo) return -1;
      if (a.Status !== ClienteStatus.Ativo && b.Status === ClienteStatus.Ativo) return 1;
      switch (sortCriteria) {
        case 'newest': return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
        case 'oldest': return new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
        case 'highest_value': return b.FaixaValorMax - a.FaixaValorMax;
        case 'lowest_value': return a.FaixaValorMax - b.FaixaValorMax;
        default: return 0;
      }
    });
  }, [clientes, cidadeFilter, bairroFilter, estadoFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter, sortCriteria]);

  const handleSaveCliente = async (formData: Partial<Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'CreatedAt'>>, id?: string) => {
    if (!user) return;
    try {
      let savedCliente: Cliente;
      if (id) {
        savedCliente = await api.updateCliente(id, formData);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const clienteData = { ...formData, ID_Corretor: user.corretorInfo.ID_Corretor };
        savedCliente = await api.createCliente(clienteData as Omit<Cliente, 'ID_Cliente' | 'Status' | 'CreatedAt'>);
        toast.success("Cliente criado com sucesso!");
      }
      handleCloseModal();
      fetchClientes();
      if (savedCliente.Status === 'Ativo') {
        api.findMatchesForCliente(savedCliente).catch(err => console.error("Background match finding failed:", err));
      }
    } catch (error) {
      console.error("Failed to save cliente", error);
      toast.error("Falha ao salvar cliente. Tente novamente.");
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    openClienteModal();
  };

  const handleArchive = async (cliente: Cliente) => {
    if (window.confirm(`Tem certeza que deseja arquivar este cliente? Ele será removido da sua lista principal, mas o histórico de parcerias será mantido.`)) {
      try {
        await api.updateCliente(cliente.ID_Cliente, { Status: ClienteStatus.Inativo });
        toast.success("Cliente arquivado com sucesso.");
        fetchClientes();
      } catch (error) {
        console.error("Failed to archive cliente", error);
        toast.error("Falha ao arquivar o cliente.");
      }
    }
  };

  const handleCloseModal = () => {
    setEditingCliente(null);
    closeClienteModal();
  };

  const handleBuscarMatch = async (cliente: Cliente) => {
    setFindingMatch(cliente.ID_Cliente);
    try {
        const newMatches = await api.findMatchesForCliente(cliente);
        if (newMatches.length === 0) {
            toast('Nenhum novo match encontrado para este cliente.', { icon: '🤷' });
        }
    } catch(error) {
        toast.error("Ocorreu um erro ao buscar por matches.");
    } finally {
        setFindingMatch(null);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  const sortOptions: { label: string; value: SortCriteria }[] = [
    { label: 'Recém Adicionados', value: 'newest' },
    { label: 'Mais Antigos', value: 'oldest' },
    { label: 'Maior Valor', value: 'highest_value' },
    { label: 'Menor Valor', value: 'lowest_value' },
  ];

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div>
      <div className="bg-white p-2 rounded-lg shadow mb-4 space-y-2">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full justify-center">
            <Filter size={16} className="mr-2" />
            Filtrar
            {areFiltersActive && <span className="ml-2 h-2 w-2 rounded-full bg-secondary" />}
          </Button>
          <div className="relative w-full" ref={sortMenuRef}>
            <Button variant="outline" onClick={() => setShowSortMenu(!showSortMenu)} className="w-full justify-center">
              <ArrowUpDown size={16} className="mr-2" />
              Ordenar
            </Button>
            {showSortMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSortCriteria(option.value); setShowSortMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${sortCriteria === option.value ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {showFilters && (
          <div className="p-2 border-t">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Cidade Desejada" value={cidadeFilter} onChange={(e) => setCidadeFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Bairro Desejado" value={bairroFilter} onChange={(e) => setBairroFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Estado (UF)" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded text-sm" maxLength={2} />
              <input type="number" placeholder="Dorms. Mín." value={dormitoriosFilter} onChange={(e) => setDormitoriosFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="number" placeholder="Valor Mín." value={valorMinFilter} onChange={(e) => setValorMinFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="number" placeholder="Valor Máx." value={valorMaxFilter} onChange={(e) => setValorMaxFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            </div>
            <Button variant="ghost" onClick={clearFilters} className="w-full text-destructive">
              <X size={16} className="mr-2" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {processedClientes.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum cliente encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">{clientes.length > 0 ? "Tente ajustar seus filtros." : "Clique no botão '+' para começar."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {processedClientes.map(cliente => (
            <div key={cliente.ID_Cliente} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-baseline space-x-2">
                        <h3 className="font-bold text-lg text-primary">{cliente.TipoImovelDesejado}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${cliente.Finalidade === 'Venda' ? 'bg-blue-500' : 'bg-orange-500'}`}>{cliente.Finalidade === 'Venda' ? 'Compra' : 'Aluguel'}</span>
                    </div>
                    <p className="text-sm text-gray-600">{cliente.CidadeDesejada} - {cliente.EstadoDesejado}</p>
                    <p className="text-sm text-gray-500">Busca em: {cliente.BairroRegiaoDesejada}</p>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <p>Faixa de Valor: {formatCurrency(cliente.FaixaValorMin)} - {formatCurrency(cliente.FaixaValorMax)}</p>
                <p>Dormitórios: {cliente.DormitoriosMinimos}+</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className={`px-2 py-1 rounded-full text-white text-sm ${cliente.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{cliente.Status}</span>
                <div className="flex space-x-2 items-center">
                    {cliente.Status === 'Ativo' && (
                        <button onClick={() => handleBuscarMatch(cliente)} disabled={findingMatch === cliente.ID_Cliente} className="text-gray-500 hover:text-secondary p-1 disabled:opacity-50 disabled:cursor-wait" title="Buscar Match">
                            {findingMatch === cliente.ID_Cliente ? <Spinner size="sm" /> : <Search size={20} />}
                        </button>
                    )}
                    <button onClick={() => handleEdit(cliente)} className="text-gray-500 hover:text-primary p-1"><Edit size={20} /></button>
                    <button onClick={() => handleArchive(cliente)} className="text-gray-500 hover:text-destructive p-1"><Trash2 size={20} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        <AddClienteModal isOpen={isClienteModalOpen} onClose={handleCloseModal} onSave={handleSaveCliente} clienteToEdit={editingCliente} />
    </div>
  );
};

export default ClientesPage;