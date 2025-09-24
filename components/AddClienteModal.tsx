import React, { useState } from 'react';
import { Cliente, Finalidade } from '../types';

interface AddClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clienteData: Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'Status'>) => void;
}

const AddClienteModal: React.FC<AddClienteModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    TipoImovelDesejado: '',
    Finalidade: Finalidade.Venda,
    CidadeDesejada: '',
    BairroRegiaoDesejada: '',
    FaixaValorMin: 0,
    FaixaValorMax: 0,
    DormitoriosMinimos: 1,
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['FaixaValorMin', 'FaixaValorMax', 'DormitoriosMinimos'];
    const numericValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TipoImovelDesejado || !formData.CidadeDesejada || formData.FaixaValorMax <= 0 || formData.FaixaValorMin > formData.FaixaValorMax) {
        alert("Por favor, preencha os campos obrigatórios e verifique se a faixa de valor é válida.");
        return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
        <h2 id="modal-title" className="text-2xl font-bold text-primary mb-4">Cadastrar Novo Cliente</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="TipoImovelDesejado" className="block text-sm font-medium text-gray-700">Tipo de Imóvel Desejado</label>
              <input id="TipoImovelDesejado" type="text" name="TipoImovelDesejado" value={formData.TipoImovelDesejado} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label htmlFor="Finalidade" className="block text-sm font-medium text-gray-700">Finalidade</label>
              <select id="Finalidade" name="Finalidade" value={formData.Finalidade} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required>
                <option value={Finalidade.Venda}>Compra</option>
                <option value={Finalidade.Aluguel}>Aluguel</option>
              </select>
            </div>
            <div>
              <label htmlFor="CidadeDesejada" className="block text-sm font-medium text-gray-700">Cidade Desejada</label>
              <input id="CidadeDesejada" type="text" name="CidadeDesejada" value={formData.CidadeDesejada} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label htmlFor="BairroRegiaoDesejada" className="block text-sm font-medium text-gray-700">Bairro/Região (separado por vírgula)</label>
              <input id="BairroRegiaoDesejada" type="text" name="BairroRegiaoDesejada" value={formData.BairroRegiaoDesejada} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="FaixaValorMin" className="block text-sm font-medium text-gray-700">Valor Mínimo (R$)</label>
                    <input id="FaixaValorMin" type="number" name="FaixaValorMin" min="0" value={formData.FaixaValorMin === 0 ? '' : formData.FaixaValorMin} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
                </div>
                <div>
                    <label htmlFor="FaixaValorMax" className="block text-sm font-medium text-gray-700">Valor Máximo (R$)</label>
                    <input id="FaixaValorMax" type="number" name="FaixaValorMax" min="1" value={formData.FaixaValorMax === 0 ? '' : formData.FaixaValorMax} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
            </div>
            <div>
              <label htmlFor="DormitoriosMinimos" className="block text-sm font-medium text-gray-700">Dormitórios Mínimos</label>
              <input id="DormitoriosMinimos" type="number" name="DormitoriosMinimos" min="0" value={formData.DormitoriosMinimos} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClienteModal;