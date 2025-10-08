import React, { useState, useEffect } from 'react';
import { Cliente, Finalidade, ClienteStatus } from '../types';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { formatBRLNumber, handleCurrencyInputChange } from '../src/utils/currency';
import { toTitleCase } from '../src/utils/formatters';
import { brazilianStates, citiesByState } from '../src/utils/brazilianLocations';

type ClienteFormData = Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'CreatedAt'>;

interface AddClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clienteData: Partial<ClienteFormData>, id?: string) => void;
  clienteToEdit?: Cliente | null;
}

const imovelTipos = ["Apartamento", "Casa", "Sala Comercial", "Loja", "Terreno", "Galpão"];

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
    detalhes_privados: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [cities, setCities] = useState<string[]>([]);

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
          detalhes_privados: clienteToEdit.detalhes_privados || '',
        });
        if (clienteToEdit.EstadoDesejado) {
            setCities(citiesByState[clienteToEdit.EstadoDesejado] || []);
        }
      } else {
        setFormData(getInitialFormData());
        setCities([]);
      }
    }
  }, [isOpen, isEditMode, clienteToEdit]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'FaixaValorMin' || name === 'FaixaValorMax') {
        const numericValue = handleCurrencyInputChange(e);
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        return;
    }

    if (name === 'DormitoriosMinimos') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
        return;
    }

    let finalValue = value;
    if (['BairroRegiaoDesejada'].includes(name)) {
        finalValue = toTitleCase(value);
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSelectChange = (name: 'Finalidade' | 'Status' | 'TipoImovelDesejado') => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (stateAbbr: string) => {
    setFormData(prev => ({ ...prev, EstadoDesejado: stateAbbr, CidadeDesejada: '' }));
    setCities(citiesByState[stateAbbr] || []);
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, CidadeDesejada: city }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TipoImovelDesejado || !formData.CidadeDesejada || !formData.EstadoDesejado || formData.FaixaValorMax <= 0 || formData.FaixaValorMin > formData.FaixaValorMax) {
        toast.error("Verifique os campos obrigatórios e a faixa de valor.");
        return;
    }

    const trimmedFormData = {
      ...formData,
      TipoImovelDesejado: formData.TipoImovelDesejado.trim(),
      CidadeDesejada: formData.CidadeDesejada.trim(),
      EstadoDesejado: formData.EstadoDesejado.trim(),
      BairroRegiaoDesejada: formData.BairroRegiaoDesejada.trim(),
      detalhes_privados: formData.detalhes_privados?.trim(),
    };

    onSave(trimmedFormData, clienteToEdit?.ID_Cliente);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
        <h2 id="modal-title" className="text-2xl font-bold text-primary mb-4">{isEditMode ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="detalhes_privados">Nome / Contato do Cliente (Privado)</Label>
              <Input id="detalhes_privados" name="detalhes_privados" value={formData.detalhes_privados} onChange={handleInputChange} placeholder="Esta informação é visível apenas para você." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="TipoImovelDesejado">Tipo de Imóvel Desejado</Label>
              <Select name="TipoImovelDesejado" value={formData.TipoImovelDesejado} onValueChange={handleSelectChange('TipoImovelDesejado')} required>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                <SelectContent>
                  {imovelTipos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <div className="space-y-1.5">
                    <Label htmlFor="EstadoDesejado">Estado</Label>
                    <Select name="EstadoDesejado" value={formData.EstadoDesejado} onValueChange={handleStateChange} required>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>
                            {brazilianStates.map(state => (
                                <SelectItem key={state.sigla} value={state.sigla}>{state.sigla}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="CidadeDesejada">Cidade Desejada</Label>
                    <Select name="CidadeDesejada" value={formData.CidadeDesejada} onValueChange={handleCityChange} required disabled={!formData.EstadoDesejado}>
                        <SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                        <SelectContent>
                            {cities.map(city => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="BairroRegiaoDesejada">Bairro/Região (separado por vírgula)</Label>
              <Input id="BairroRegiaoDesejada" name="BairroRegiaoDesejada" value={formData.BairroRegiaoDesejada} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="FaixaValorMin">Valor Mínimo (R$)</Label>
                    <Input id="FaixaValorMin" type="text" name="FaixaValorMin" value={formData.FaixaValorMin > 0 ? formatBRLNumber(formData.FaixaValorMin) : ''} onChange={handleInputChange} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="FaixaValorMax">Valor Máximo (R$)</Label>
                    <Input id="FaixaValorMax" type="text" name="FaixaValorMax" value={formData.FaixaValorMax > 0 ? formatBRLNumber(formData.FaixaValorMax) : ''} onChange={handleInputChange} required placeholder="0,00" />
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