import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cliente, ClienteStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddClienteModal from '../components/AddClienteModal';
import { Edit, Trash2, Search, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';
import ConfirmationModal from '../components/ConfirmationModal';
import FilterSortControls from '../components/FilterSortControls';
import { useNotifications } from '../contexts/NotificationContext';

type SortCriteria = 'newest' | 'oldest' | 'highest_value' | 'lowest_value' | 'archived';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isClienteModalOpen, openClienteModal, closeClienteModal } = useUI();
  const { fetchNotifications } = useNotifications();
  const [findingMatch, setFindingMatch] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteToArchive, setClienteToArchive] = useState<Cliente | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Filter and Sort states
  const [filters, setFilters] = useState({
    cidade: '',
    bairro: '',
    estado: '',
    valorMin: '',
    valorMax: '',
    dormitorios: '',
  });
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('newest');

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

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

  const areFiltersActive = useMemo(() => {
    return Object.values(filters).some(val => val !== '');
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      cidade: '',
      bairro: '',
      estado: '',
      valorMin: '',
      valorMax: '',
      dormitorios: '',
    });
  };

  const processedClientes = useMemo(() => {
    let sourceList = clientes;

    if (sortCriteria === 'archived') {
        sourceList = clientes.filter(c => c.Status === ClienteStatus.Inativo);
    } else {
        sourceList = clientes.filter(c => c.Status === ClienteStatus.Ativo);
    }

    const filtered = sourceList.filter(cliente => {
      const valorMin = parseFloat(filters.valorMin);
      const valorMax = parseFloat(filters.valorMax);
      const dormitorios = parseInt(filters.dormitorios, 10);
      const valorOverlap = (isNaN(valorMin) || cliente.FaixaValorMax >= valorMin) && (isNaN(valorMax) || cliente.FaixaValorMin <= valorMax);
      return ((filters.cidade === '' || cliente.CidadeDesejada.toLowerCase().includes(filters.cidade.toLowerCase())) && (filters.bairro === '' || cliente.BairroRegiaoDesejada.toLowerCase().includes(filters.bairro.toLowerCase())) && (filters.estado === '' || (cliente.EstadoDesejado && cliente.EstadoDesejado.toLowerCase().includes(filters.estado.toLowerCase()))) && valorOverlap && (isNaN(dormitorios) || cliente.DormitoriosMinimos >= dormitorios));
    });

    if (sortCriteria === 'archived') return filtered;

    return filtered.sort((a, b) => {
      switch (sortCriteria) {
        case 'newest': return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
        case 'oldest': return new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
        case 'highest_value': return b.FaixaValorMax - a.FaixaValorMax;
        case 'lowest_value': return a.FaixaValorMax - b.FaixaValorMax;
        default: return 0;
      }
    });
  }, [clientes, filters, sortCriteria]);

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
        const toastId = toast.loading('Buscando novos matches...');
        try {
          const newMatches = await api.findMatchesForCliente(savedCliente);
          if (newMatches.length > 0) {
            toast.success(`${newMatches.length} novo(s) match(es) encontrado(s)!`, { id: toastId, icon: '🤝' });
            fetchNotifications();
          } else {
            toast.success('Nenhum novo match encontrado.', { id: toastId });
          }
        } catch (matchError) {
          console.error("Background match finding failed:", matchError);
          toast.error('Erro ao buscar por matches.', { id: toastId });
        }
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

  const handleArchive = (cliente: Cliente) => {
    setClienteToArchive(cliente);
    setShowArchiveConfirm(true);
  };

  const confirmArchive = async () => {
    if (clienteToArchive) {
      try {
        await api.updateCliente(clienteToArchive.ID_Cliente, { Status: ClienteStatus.Inativo });
        toast.success("Cliente arquivado com sucesso.");
        fetchClientes();
      } catch (error) {
        console.error("Failed to archive cliente", error);
        toast.error("Falha ao arquivar o cliente.");
      } finally {
        setShowArchiveConfirm(false);
        setClienteToArchive(null);
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
        if (newMatches.length > 0) {
            toast.success(`${newMatches.length} novo(s) match(es) encontrado(s)!`, { icon: '🤝' });
            fetchNotifications();
        } else {
            toast('Nenhum novo match encontrado para este cliente.', { icon: '🤷' });
        }
    } catch(error) {
        toast.error("Ocorreu um erro ao buscar por matches.");
    } finally {
        setFindingMatch(null);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div>
      <FilterSortControls
        filters={filters}
        onFilterChange={handleFilterChange}
        sortCriteria={sortCriteria}
        onSortChange={setSortCriteria}
        areFiltersActive={areFiltersActive}
        onClearFilters={clearFilters}
        placeholders={{
          bairro: 'Bairro Desejado',
        }}
        onAddClick={openClienteModal} // Passando a função para abrir o modal de cliente
      />

      {processedClientes.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum cliente encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">{clientes.length > 0 ? "Tente ajustar seus filtros ou veja os arquivados." : "Clique no botão '+' para começar."}</p>
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
              {cliente.detalhes_privados && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start text-xs text-gray-500">
                          <Lock size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                          <p><span className="font-semibold">Notas Privadas:</span> {cliente.detalhes_privados}</p>
                      </div>
                  </div>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className={`px-2 py-1 rounded-full text-white text-sm ${cliente.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{cliente.Status}</span>
                <div className="flex space-x-2 items-center">
                    {cliente.Status === 'Ativo' && (
                        <button onClick={() => handleBuscarMatch(cliente)} disabled={findingMatch === cliente.ID_Cliente} className="text-gray-500 hover:text-secondary p-1 disabled:opacity-50 disabled:cursor-wait" title="Buscar Match">
                            {findingMatch === cliente.ID_Cliente ? <Spinner size="sm" /> : <Search size={20} />}
                        </button>
                    )}
                    <button onClick={() => handleEdit(cliente)} className="text-gray-500 hover:text-primary p-1"><Edit size={20} /></button>
                    {cliente.Status === 'Ativo' && (
                        <button onClick={() => handleArchive(cliente)} className="text-gray-500 hover:text-destructive p-1"><Trash2 size={20} /></button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        <AddClienteModal isOpen={isClienteModalOpen} onClose={handleCloseModal} onSave={handleSaveCliente} clienteToEdit={editingCliente} />
        <ConfirmationModal
            isOpen={showArchiveConfirm}
            onClose={() => setShowArchiveConfirm(false)}
            onConfirm={confirmArchive}
            title="Confirmar Arquivamento"
            message="Tem certeza que deseja arquivar este cliente? Ele será removido da sua lista principal, mas o histórico de parcerias será mantido."
            confirmText="Arquivar"
        />
    </div>
  );
};

export default ClientesPage;