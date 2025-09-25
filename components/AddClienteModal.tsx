import React, { useState, useEffect } from 'react';
import { Cliente, Finalidade, ClienteStatus } from '../types';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

type ClienteFormData = Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'CreatedAt'>;

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
    EstadoDesejado: '',
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
          EstadoDesejado: clienteToEdit.EstadoDesejado || '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['FaixaValorMin', 'FaixaValorMax', 'DormitoriosMinimos'];
    const finalValue = name === 'EstadoDesejado' ? value.toUpperCase() : value;
    const numericValue = numericFields.includes(name) ? parseFloat(finalValue) || 0 : finalValue;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSelectChange = (name: 'Finalidade' | 'Status') => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TipoImovelDesejado || !formData.CidadeDesejada || !formData.EstadoDesejado || formData.FaixaValorMax <= 0 || formData.FaixaValorMin > formData.FaixaValorMax) {
        toast.error("Verifique os campos obrigatórios e a faixa de valor.");
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
            <div className="space-y-1.5">
              <Label htmlFor="TipoImovelDesejado">Tipo de Imóvel Desejado</Label>
              <Input id="TipoImovelDesejado" name="TipoImovelDesejado" value={formData.TipoImovelDesejado} onChange={handleInputChange} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="Finalidade">Finalidade</Label>
              <Select name="Finalidade" value={formData.Finalidade} onValueChange={handleSelectChange('Finalidade')} required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Finalidade.Venda}>Compra</SelectItem>
                  <SelectItem value={Finalidade.Aluguel}>Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="CidadeDesejada">Cidade Desejada</Label>
                    <Input id="CidadeDesejada" name="CidadeDesejada" value={formData.CidadeDesejada} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="EstadoDesejado">Estado</Label>
                    <Input id="EstadoDesejado" name="EstadoDesejado" value={formData.EstadoDesejado} onChange={handleInputChange} required maxLength={2} placeholder="UF" />
                </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="BairroRegiaoDesejada">Bairro/Região (separado por vírgula)</Label>
              <Input id="BairroRegiaoDesejada" name="BairroRegiaoDesejada" value={formData.BairroRegiaoDesejada} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="FaixaValorMin">Valor Mínimo (R$)</Label>
                    <Input id="FaixaValorMin" type="number" name="FaixaValorMin" min="0" value={formData.FaixaValorMin === 0 ? '' : formData.FaixaValorMin} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="FaixaValorMax">Valor Máximo (R$)</Label>
                    <Input id="FaixaValorMax" type="number" name="FaixaValorMax" min="1" value={formData.FaixaValorMax === 0 ? '' : formData.FaixaValorMax} onChange={handleInputChange} required />
                </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="DormitoriosMinimos">Dormitórios Mínimos</Label>
              <Input id="DormitoriosMinimos" type="number" name="DormitoriosMinimos" min="0" value={formData.DormitoriosMinimos} onChange={handleInputChange} required />
            </div>
            {isEditMode && (
                <div className="space-y-1.5">
                    <Label htmlFor="Status">Status</Label>
                    <Select name="Status" value={formData.Status} onValueChange={handleSelectChange('Status')} required>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ClienteStatus.Ativo}>Ativo</SelectItem>
                            <SelectItem value={ClienteStatus.Inativo}>Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditMode ? 'Salvar Alterações' : 'Salvar Cliente'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClienteModal;