import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddClienteModal from '../components/AddClienteModal';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isClienteModalOpen, closeClienteModal } = useUI();

  // Filter states
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dormitoriosFilter, setDormitoriosFilter] = useState('');

  const fetchClientes = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        // FIX: Passed user.corretorInfo.ID_Corretor to getClientesByCorretor
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
        valorOverlap &&
        (isNaN(dormitorios) || cliente.DormitoriosMinimos >= dormitorios)
      );
    });
  }, [clientes, cidadeFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter]);

  const handleAddCliente = async (clienteData: Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'Status'>) => {
    if (!user) return;
    try {
      // FIX: Added ID_Corretor to the new client data before sending to the API.
      const newClienteData = {
        ...clienteData,
        ID_Corretor: user.corretorInfo.ID_Corretor,
      };
      await api.createCliente(newClienteData);
      closeClienteModal();
      fetchClientes(); // Refresh the list
    } catch (error) {
      console.error("Failed to create cliente", error);
      alert("Falha ao cadastrar cliente. Tente novamente.");
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
              <h3 className="font-bold text-lg text-primary">{cliente.TipoImovelDesejado} em {cliente.CidadeDesejada}</h3>
              <p className="text-sm text-gray-600">Busca em: {cliente.BairroRegiaoDesejada}</p>
              <div className="mt-2 text-sm">
                <p>Faixa de Valor: {formatCurrency(cliente.FaixaValorMin)} - {formatCurrency(cliente.FaixaValorMax)}</p>
                <p>Dormitórios: {cliente.DormitoriosMinimos}+</p>
              </div>
              <div className="mt-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-white ${cliente.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{cliente.Status}</span>
              </div>
              <button
                // onClick={() => handleBuscarMatch(cliente)}
                className="mt-4 w-full bg-secondary hover:bg-amber-500 text-primary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-neutral-DEFAULT"
              >
                Buscar Match
              </button>
            </div>
          ))}
        </div>
      )}
        <AddClienteModal
            isOpen={isClienteModalOpen}
            onClose={closeClienteModal}
            onSave={handleAddCliente}
        />
    </div>
  );
};

export default ClientesPage;