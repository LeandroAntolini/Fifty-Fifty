import React, { useState, useEffect } from 'react';
import { Imovel, Finalidade, ImovelStatus } from '../types';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

type ImovelFormData = Omit<Imovel, 'ID_Imovel' | 'ID_Corretor' | 'Imagens' | 'CreatedAt'>;

export interface ImageChanges {
  newImagesBase64: string[];
  imagesToDelete: string[];
}

interface AddImovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imovelData: Partial<ImovelFormData>, id?: string, imageChanges?: ImageChanges) => void;
  imovelToEdit?: Imovel | null;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const AddImovelModal: React.FC<AddImovelModalProps> = ({ isOpen, onClose, onSave, imovelToEdit }) => {
  const isEditMode = !!imovelToEdit;

  const getInitialFormData = (): ImovelFormData => ({
    Tipo: '',
    Finalidade: Finalidade.Venda,
    Cidade: '',
    Estado: '',
    Bairro: '',
    Valor: 0,
    Dormitorios: 1,
    Metragem: 0,
    Status: ImovelStatus.Ativo,
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && imovelToEdit) {
        setFormData({
          Tipo: imovelToEdit.Tipo,
          Finalidade: imovelToEdit.Finalidade,
          Cidade: imovelToEdit.Cidade,
          Estado: imovelToEdit.Estado || '',
          Bairro: imovelToEdit.Bairro,
          Valor: imovelToEdit.Valor,
          Dormitorios: imovelToEdit.Dormitorios,
          Metragem: imovelToEdit.Metragem || 0,
          Status: imovelToEdit.Status,
        });
        setExistingImages(imovelToEdit.Imagens || []);
      } else {
        setFormData(getInitialFormData());
        setExistingImages([]);
      }
      setNewImageFiles([]);
      setNewImagePreviews([]);
      setImagesToDelete([]);
    }
  }, [isOpen, isEditMode, imovelToEdit]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['Valor', 'Dormitorios', 'Metragem'];
    const finalValue = name === 'Estado' ? value.toUpperCase() : value;
    const numericValue = numericFields.includes(name) ? parseFloat(finalValue) || 0 : finalValue;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSelectChange = (name: 'Finalidade' | 'Status') => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as Finalidade | ImovelStatus }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setNewImageFiles(prev => [...prev, ...filesArray]);

        const previewsArray = filesArray.map(file => URL.createObjectURL(file));
        setNewImagePreviews(prev => [...prev, ...previewsArray]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Tipo || !formData.Cidade || !formData.Estado || !formData.Bairro || formData.Valor <= 0) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        return;
    }
    
    const newImagesBase64 = await Promise.all(newImageFiles.map(file => fileToBase64(file)));
    
    onSave(
      formData,
      imovelToEdit?.ID_Imovel,
      { newImagesBase64, imagesToDelete }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-20 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4 my-8">
        <h2 id="modal-title" className="text-2xl font-bold text-primary mb-4">{isEditMode ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="Tipo">Tipo (ex: Apartamento, Casa)</Label>
              <Input id="Tipo" name="Tipo" value={formData.Tipo} onChange={handleInputChange} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="Finalidade">Finalidade</Label>
              <Select name="Finalidade" value={formData.Finalidade} onValueChange={handleSelectChange('Finalidade')} required>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Finalidade.Venda}>Venda</SelectItem>
                  <SelectItem value={Finalidade.Aluguel}>Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="Cidade">Cidade</Label>
                    <Input id="Cidade" name="Cidade" value={formData.Cidade} onChange={handleInputChange} required />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="Estado">Estado</Label>
                    <Input id="Estado" name="Estado" value={formData.Estado} onChange={handleInputChange} required maxLength={2} placeholder="UF" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="Bairro">Bairro</Label>
                <Input id="Bairro" name="Bairro" value={formData.Bairro} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="Valor">Valor (R$)</Label>
                    <Input id="Valor" type="number" name="Valor" min="1" value={formData.Valor === 0 ? '' : formData.Valor} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="Dormitorios">Dorms</Label>
                    <Input id="Dormitorios" type="number" name="Dormitorios" min="0" value={formData.Dormitorios} onChange={handleInputChange} required />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="Metragem">Área (m²)</Label>
                    <Input id="Metragem" type="number" name="Metragem" min="0" value={formData.Metragem === 0 ? '' : formData.Metragem} onChange={handleInputChange} />
                </div>
            </div>
            {isEditMode && (
                <div className="space-y-1.5">
                    <Label htmlFor="Status">Status</Label>
                    <Select name="Status" value={formData.Status} onValueChange={handleSelectChange('Status')} required>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ImovelStatus.Ativo}>Ativo</SelectItem>
                            <SelectItem value={ImovelStatus.Inativo}>Inativo</SelectItem>
                            <SelectItem value={ImovelStatus.Vendido}>Vendido</SelectItem>
                            <SelectItem value={ImovelStatus.Alugado}>Alugado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div>
                <Label>Imagens do Imóvel</Label>
                {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                        {existingImages.map((url) => (
                            <div key={url} className="relative">
                                <img src={url} alt="Imagem existente" className="h-24 w-full object-cover rounded-md" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleRemoveExistingImage(url)}
                                    className="absolute top-0 right-0 h-5 w-5 rounded-full"
                                >X</Button>
                            </div>
                        ))}
                        {newImagePreviews.map((preview, index) => (
                            <div key={preview} className="relative">
                                <img src={preview} alt={`Preview ${index}`} className="h-24 w-full object-cover rounded-md" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleRemoveNewImage(index)}
                                    className="absolute top-0 right-0 h-5 w-5 rounded-full"
                                >X</Button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div className="flex text-sm text-gray-600">
                        <Label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
                        <span>Carregar novas imagens</span>
                        <input id="file-upload" name="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleImageChange} />
                        </Label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                    </div>
                </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditMode ? 'Salvar Alterações' : 'Salvar Imóvel'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddImovelModal;