import React, { useState, useEffect } from 'react';
import { Imovel, Finalidade, ImovelStatus } from '../types';
import toast from 'react-hot-toast';

type ImovelFormData = Omit<Imovel, 'ID_Imovel' | 'ID_Corretor' | 'Imagens'>;

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

  const getInitialFormData = () => ({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['Valor', 'Dormitorios', 'Metragem'];
    const finalValue = name === 'Estado' ? value.toUpperCase() : value;
    const numericValue = numericFields.includes(name) ? parseFloat(finalValue) || 0 : finalValue;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
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
            {/* Form fields remain the same */}
            <div>
              <label htmlFor="Tipo" className="block text-sm font-medium text-gray-700">Tipo (ex: Apartamento, Casa)</label>
              <input id="Tipo" type="text" name="Tipo" value={formData.Tipo} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label htmlFor="Finalidade" className="block text-sm font-medium text-gray-700">Finalidade</label>
              <select id="Finalidade" name="Finalidade" value={formData.Finalidade} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required>
                <option value={Finalidade.Venda}>Venda</option>
                <option value={Finalidade.Aluguel}>Aluguel</option>
              </select>
            </div>
             <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label htmlFor="Cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input id="Cidade" type="text" name="Cidade" value={formData.Cidade} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
                 <div>
                    <label htmlFor="Estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <input id="Estado" type="text" name="Estado" value={formData.Estado} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required maxLength={2} placeholder="UF" />
                </div>
            </div>
            <div>
                <label htmlFor="Bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
                <input id="Bairro" type="text" name="Bairro" value={formData.Bairro} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label htmlFor="Valor" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                    <input id="Valor" type="number" name="Valor" min="1" value={formData.Valor === 0 ? '' : formData.Valor} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                    <label htmlFor="Dormitorios" className="block text-sm font-medium text-gray-700">Dorms</label>
                    <input id="Dormitorios" type="number" name="Dormitorios" min="0" value={formData.Dormitorios} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required />
                </div>
                <div>
                    <label htmlFor="Metragem" className="block text-sm font-medium text-gray-700">Área (m²)</label>
                    <input id="Metragem" type="number" name="Metragem" min="0" value={formData.Metragem === 0 ? '' : formData.Metragem} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
                </div>
            </div>
            {isEditMode && (
                <div>
                    <label htmlFor="Status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select id="Status" name="Status" value={formData.Status} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" required>
                        <option value={ImovelStatus.Ativo}>Ativo</option>
                        <option value={ImovelStatus.Inativo}>Inativo</option>
                        <option value={ImovelStatus.Vendido}>Vendido</option>
                        <option value={ImovelStatus.Alugado}>Alugado</option>
                    </select>
                </div>
            )}
            
            {/* Image Management Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Imagens do Imóvel</label>
                {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                    <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                        {existingImages.map((url) => (
                            <div key={url} className="relative">
                                <img src={url} alt="Imagem existente" className="h-24 w-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(url)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        {newImagePreviews.map((preview, index) => (
                            <div key={preview} className="relative">
                                <img src={preview} alt={`Preview ${index}`} className="h-24 w-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveNewImage(index)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
                        <span>Carregar novas imagens</span>
                        <input id="file-upload" name="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleImageChange} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                    </div>
                </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded">
              {isEditMode ? 'Salvar Alterações' : 'Salvar Imóvel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddImovelModal;