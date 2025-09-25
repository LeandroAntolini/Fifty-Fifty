import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddClienteModal from '../components/AddClienteModal';
import { Edit, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isClienteModalOpen, openClienteModal, closeClienteModal } = useUI();
  const [findingMatch, setFindingMatch] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Filter states
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dormitoriosFilter, setDormitoriosFilter] = useState('');

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

    const channel = supabase
      .channel(`clientes-page-channel-for-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes', filter: `id_corretor=eq.${user.id}` },
        () => {
          fetchClientes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchClientes]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const valorMin = parseFloat(valorMinFilter);
      const valorMax = parseFloat(valorMaxFilter);
      const dormitorios = parseInt(dormitoriosFilter, 10);

      const valorOverlap = 
        (isNaN(valorMin) || cliente.FaixaValorMax >= valorMin) &&
        (isNaN(valorMax) || cliente.FaixaValorMin <= valorMax);

      return (
        (cidadeFilter === '' || cliente.CidadeDesejada.toLowerCase().includes(cidadeFilter.toLowerCase())) &&
        (bairroFilter === '' || cliente.BairroRegiaoDesejada.toLowerCase().includes(bairroFilter.toLowerCase())) &&
        (estadoFilter === '' || (cliente.EstadoDesejado && cliente.EstadoDesejado.toLowerCase().includes(estadoFilter.toLowerCase()))) &&
        valorOverlap &&
        (isNaN(dormitorios) || cliente.DormitoriosMinimos >= dormitorios)
      );
    });
  }, [clientes, cidadeFilter, bairroFilter, estadoFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter]);

  const handleSaveCliente = async (formData: Partial<Omit<Cliente, 'ID_Cliente' | 'ID_Corretor'>>, id?: string) => {
    if (!user) return;
    try {
      if (id) {
        await api.updateCliente(id, formData);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        const clienteData = {
          ...formData,
          ID_Corretor: user.corretorInfo.ID_Corretor,
        };
        await api.createCliente(clienteData as Omit<Cliente, 'ID_Cliente' | 'Status'>);
        toast.success("Cliente criado com sucesso!");
      }
      handleCloseModal();
      fetchClientes(); // Manually refetch after saving
    } catch (error) {
      console.error("Failed to save cliente", error);
      toast.error("Falha ao salvar cliente. Tente novamente.");
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    openClienteModal();
  };

  const handleDelete = async (cliente: Cliente) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente que busca "${cliente.TipoImovelDesejado} em ${cliente.CidadeDesejada}"?`)) {
      try {
        await api.deleteCliente(cliente.ID_Cliente);
        toast.success("Cliente excluído com sucesso.");
        fetchClientes(); // Manually refetch after deleting
      } catch (error) {
        console.error("Failed to delete cliente", error);
        toast.error("Falha ao excluir cliente.");
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  }

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Filtrar Clientes</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Cidade Desejada"
            value={cidadeFilter}
            onChange={(e) => setCidadeFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Bairro Desejado"
            value={bairroFilter}
            onChange={(e) => setBairroFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Estado (UF)"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border rounded text-sm"
            maxLength={2}
          />
          <input
            type="number"
            placeholder="Dorms. Mín."
            value={dormitoriosFilter}
            onChange={(e) => setDormitoriosFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <input
            type="number"
            placeholder="Valor Mín."
            value={valorMinFilter}
            onChange={(e) => setValorMinFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
          <input
            type="number"
            placeholder="Valor Máx."
            value={valorMaxFilter}
            onChange={(e) => setValorMaxFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
      </div>

      {filteredClientes.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum cliente encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">{clientes.length > 0 ? "Tente ajustar seus filtros." : "Clique no botão '+' para começar."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClientes.map(cliente => (
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
                        <button
                            onClick={() => handleBuscarMatch(cliente)}
                            disabled={findingMatch === cliente.ID_Cliente}
                            className="text-gray-500 hover:text-secondary p-1 disabled:opacity-50 disabled:cursor-wait"
                            title="Buscar Match"
                        >
                            {findingMatch === cliente.ID_Cliente ? <Spinner size="sm" /> : <Sparkles size={20} />}
                        </button>
                    )}
                    <button onClick={() => handleEdit(cliente)} className="text-gray-500 hover:text-primary p-1"><Edit size={20} /></button>
                    <button onClick={() => handleDelete(cliente)} className="text-gray-500 hover:text-destructive p-1"><Trash2 size={20} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        <AddClienteModal
            isOpen={isClienteModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveCliente}
            clienteToEdit={editingCliente}
        />
    </div>
  );
};

export default ClientesPage;