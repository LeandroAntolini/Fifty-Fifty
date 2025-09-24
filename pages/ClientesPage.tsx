import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddClienteModal from '../components/AddClienteModal';
import { Edit, Trash2 } from 'lucide-react';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isClienteModalOpen, openClienteModal, closeClienteModal } = useUI();
  const [findingMatch, setFindingMatch] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  // Filter states
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dormitoriosFilter, setDormitoriosFilter] = useState('');

  const fetchClientes = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const data = await api.getClientesByCorretor(user.corretorInfo.ID_Corretor);
        setClientes(data);
      } catch (error) {
        console.error("Failed to fetch clientes", error);
        alert(`Não foi possível carregar os clientes. ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

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
        (estadoFilter === '' || (cliente.EstadoDesejado && cliente.EstadoDesejado.toLowerCase().includes(estadoFilter.toLowerCase()))) &&
        valorOverlap &&
        (isNaN(dormitorios) || cliente.DormitoriosMinimos >= dormitorios)
      );
    });
  }, [clientes, cidadeFilter, estadoFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter]);

  const handleSaveCliente = async (formData: Partial<Omit<Cliente, 'ID_Cliente' | 'ID_Corretor'>>, id?: string) => {
    if (!user) return;
    try {
      if (id) {
        await api.updateCliente(id, formData);
      } else {
        const clienteData = {
          ...formData,
          ID_Corretor: user.corretorInfo.ID_Corretor,
        };
        await api.createCliente(clienteData as Omit<Cliente, 'ID_Cliente' | 'Status'>);
      }
      handleCloseModal();
      fetchClientes();
    } catch (error) {
      console.error("Failed to save cliente", error);
      alert("Falha ao salvar cliente. Tente novamente.");
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
        fetchClientes();
      } catch (error) {
        console.error("Failed to delete cliente", error);
        alert("Falha ao excluir cliente.");
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
            alert(`${newMatches.length} novo(s) match(s) encontrado(s)! Verifique a aba de Matches.`);
        } else {
            alert("Nenhum novo match encontrado para este cliente no momento.");
        }
    } catch(error) {
        alert("Ocorreu um erro ao buscar por matches.");
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
                    <h3 className="font-bold text-lg text-primary">{cliente.TipoImovelDesejado} em {cliente.CidadeDesejada} - {cliente.EstadoDesejado}</h3>
                    <p className="text-sm text-gray-600">Busca em: {cliente.BairroRegiaoDesejada}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => handleEdit(cliente)} className="text-gray-500 hover:text-primary p-1"><Edit size={20} /></button>
                    <button onClick={() => handleDelete(cliente)} className="text-gray-500 hover:text-destructive p-1"><Trash2 size={20} /></button>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <p>Faixa de Valor: {formatCurrency(cliente.FaixaValorMin)} - {formatCurrency(cliente.FaixaValorMax)}</p>
                <p>Dormitórios: {cliente.DormitoriosMinimos}+</p>
              </div>
              <div className="mt-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-white ${cliente.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{cliente.Status}</span>
              </div>
              <button
                onClick={() => handleBuscarMatch(cliente)}
                disabled={findingMatch === cliente.ID_Cliente}
                className="mt-4 w-full bg-secondary hover:bg-amber-500 text-primary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-neutral-DEFAULT"
              >
                {findingMatch === cliente.ID_Cliente ? 'Buscando...' : 'Buscar Match'}
              </button>
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