import React, { useState, useEffect } from 'react';
import { Cliente, Finalidade, ClienteStatus } from '../types';

type ClienteFormData = Omit<Cliente, 'ID_Cliente' | 'ID_Corretor'>;

interface AddClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clienteData: Partial<ClienteFormData>, id?: string) => void;
  clienteToEdit?: Cliente | null;
}

const AddClienteModal: React.FC<AddClienteModalProps> = ({ isOpen, onClose, onSave, clienteToEdit }) => {
  const isEditMode = !!clienteToEdit;

  const getInitialFormData = (): ClienteFormData => ({
    TipoImovelDesejado: '',
    Finalidade: Finalidade.Venda,
    CidadeDesejada: '',
    BairroRegiaoDesejada: '',
    FaixaValorMin: 0,
    FaixaValorMax: 0,
    DormitoriosMinimos: 1,
    Status: ClienteStatus.Ativo,
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && clienteToEdit) {
        setFormData({
          TipoImovelDesejado: clienteToEdit.TipoImovelDesejado,
          Finalidade: clienteToEdit.Finalidade,
          CidadeDesejada: clienteToEdit.CidadeDesejada,
          BairroRegiaoDesejada: clienteToEdit.BairroRegiaoDesejada,
          FaixaValorMin: clienteToEdit.FaixaValorMin,
          FaixaValorMax: clienteToEdit.FaixaValorMax,
          DormitoriosMinimos: clienteToEdit.DormitoriosMinimos,
          Status: clienteToEdit.Status,
        });
      } else {
        setFormData(getInitialFormData());
      }
    }
  }, [isOpen, isEditMode, clienteToEdit]);

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
    onSave(formData, clienteToEdit?.ID_Cliente);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
        <h2 id="modal-title" className="text-2xl font-bold text-primary mb-4">{isEditMode ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
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
            {isEditMode && (
                <div>
                    <label htmlFor="Status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="Status" name="Status" value={formData.Status} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required>
                        <option value={ClienteStatus.Ativo}>Ativo</option>
                        <option value={ClienteStatus.Inativo}>Inativo</option>
                    </select>
                </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">
              {isEditMode ? 'Salvar Alterações' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClienteModal;