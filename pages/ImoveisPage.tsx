import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Imovel, ImovelStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddImovelModal, { ImageChanges } from '../components/AddImovelModal';
import { Edit, Trash2, Search, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';
import ConfirmationModal from '../components/ConfirmationModal';
import FilterSortControls from '../components/FilterSortControls';
import { useNotifications } from '../contexts/NotificationContext';

type SortCriteria = 'newest' | 'oldest' | 'highest_value' | 'lowest_value' | 'archived';

// Image Carousel Component
const ImageCarousel = ({ images, alt }: { images: string[] | undefined, alt: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return <div className="h-48 w-full bg-gray-200 rounded-t-lg flex items-center justify-center"><span className="text-gray-500">Sem imagem</span></div>;
    }

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="relative h-48 w-full group">
            <img src={images[currentIndex]} alt={alt} className="w-full h-full object-cover rounded-t-lg" />
             {images.length > 1 && (
                <>
                    <button onClick={goToPrevious} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity">‹</button>
                    <button onClick={goToNext} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity">›</button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                        {images.map((_, index) => (
                            <div key={index} className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-gray-400'}`}></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};


const ImoveisPage: React.FC = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isImovelModalOpen, openImovelModal, closeImovelModal } = useUI();
  const { fetchNotifications } = useNotifications();
  const [findingMatch, setFindingMatch] = useState<string | null>(null);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  
  const [confirmationConfig, setConfirmationConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
    isDestructive: false,
    confirmText: '',
  });

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

  const fetchImoveis = useCallback(async () => {
    if (user) {
      try {
        const data = await api.getImoveisByCorretor(user.corretorInfo.ID_Corretor);
        setImoveis(data);
      } catch (error) {
        console.error("Failed to fetch imoveis", error);
        toast.error(`Não foi possível carregar os imóveis.`);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchImoveis();
  }, [fetchImoveis]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`imoveis-page-channel-for-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis', filter: `id_corretor=eq.${user.id}` },
        () => {
          fetchImoveis();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchImoveis]);

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

  const processedImoveis = useMemo(() => {
    let sourceList = imoveis;

    if (sortCriteria === 'archived') {
        sourceList = imoveis.filter(i => i.Status === ImovelStatus.Inativo || i.Status === ImovelStatus.Vendido || i.Status === ImovelStatus.Alugado);
    } else {
        sourceList = imoveis.filter(i => i.Status === ImovelStatus.Ativo);
    }

    const filtered = sourceList.filter(imovel => {
      const valorMin = parseFloat(filters.valorMin);
      const valorMax = parseFloat(filters.valorMax);
      const dormitorios = parseInt(filters.dormitorios, 10);

      return (
        (filters.cidade === '' || imovel.Cidade.toLowerCase().includes(filters.cidade.toLowerCase())) &&
        (filters.bairro === '' || imovel.Bairro.toLowerCase().includes(filters.bairro.toLowerCase())) &&
        (filters.estado === '' || (imovel.Estado && imovel.Estado.toLowerCase().includes(filters.estado.toLowerCase()))) &&
        (isNaN(valorMin) || imovel.Valor >= valorMin) &&
        (isNaN(valorMax) || imovel.Valor <= valorMax) &&
        (isNaN(dormitorios) || imovel.Dormitorios >= dormitorios)
      );
    });

    if (sortCriteria === 'archived') return filtered;

    return filtered.sort((a, b) => {
      switch (sortCriteria) {
        case 'newest': return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
        case 'oldest': return new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
        case 'highest_value': return b.Valor - a.Valor;
        case 'lowest_value': return a.Valor - b.Valor;
        default: return 0;
      }
    });
  }, [imoveis, filters, sortCriteria]);

  const handleSaveImovel = async (formData: Partial<Omit<Imovel, 'ID_Imovel' | 'ID_Corretor' | 'CreatedAt'>>, id?: string, imageChanges?: ImageChanges) => {
    if (!user) return;
    try {
      let savedImovel: Imovel;
      if (id) {
        savedImovel = await api.updateImovel(id, formData, imageChanges);
        toast.success("Imóvel atualizado com sucesso!");
      } else {
        const imovelData = { ...formData, ID_Corretor: user.corretorInfo.ID_Corretor, Imagens: imageChanges?.newImagesBase64 || [] };
        savedImovel = await api.createImovel(imovelData as Omit<Imovel, 'ID_Imovel' | 'Status' | 'CreatedAt'> & { Imagens?: string[] });
        toast.success("Imóvel criado com sucesso!");
      }
      handleCloseModal();
      fetchImoveis();
      
      if (savedImovel.Status === 'Ativo') {
        const toastId = toast.loading('Buscando novos matches...');
        try {
          const newMatches = await api.findMatchesForImovel(savedImovel);
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
      console.error("Failed to save imovel", error);
      toast.error((error as Error).message || "Falha ao salvar imóvel. Tente novamente.");
    }
  };
  
  const handleEdit = (imovel: Imovel) => {
    setEditingImovel(imovel);
    openImovelModal();
  };

  const handleCloseConfirmation = () => {
    setConfirmationConfig({ ...confirmationConfig, isOpen: false });
  };

  const handleDeleteClick = (imovel: Imovel) => {
    setConfirmationConfig({
      isOpen: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir o imóvel "${imovel.Tipo} em ${imovel.Bairro}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await api.deleteImovel(imovel.ID_Imovel, imovel.Imagens);
          toast.success("Imóvel excluído com sucesso.");
          fetchImoveis();
        } catch (error) {
          console.error("Failed to delete imovel", error);
          toast.error("Falha ao excluir imóvel.");
        } finally {
          handleCloseConfirmation();
        }
      },
      isDestructive: true,
      confirmText: "Excluir",
    });
  };

  const handleCloseModal = () => {
    setEditingImovel(null);
    closeImovelModal();
  };

  const handleBuscarMatch = async (imovel: Imovel) => {
    setFindingMatch(imovel.ID_Imovel);
    try {
        const newMatches = await api.findMatchesForImovel(imovel);
        if (newMatches.length > 0) {
            toast.success(`${newMatches.length} novo(s) match(es) encontrado(s)!`, { icon: '🤝' });
            fetchNotifications();
        } else {
            toast('Nenhum novo match encontrado para este imóvel.', { icon: '🤷' });
        }
    } catch(error) {
        toast.error("Ocorreu um erro ao buscar por matches.");
    } finally {
        setFindingMatch(null);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
          cidade: 'Cidade',
          bairro: 'Bairro',
        }}
      />

      {processedImoveis.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum imóvel encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">{imoveis.length > 0 ? "Tente ajustar seus filtros ou veja os negociados." : "Clique no botão '+' para começar."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {processedImoveis.map(imovel => (
            <div key={imovel.ID_Imovel} className="bg-white rounded-lg shadow overflow-hidden">
              <ImageCarousel images={imovel.Imagens} alt={imovel.Tipo} />
              <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-primary">{imovel.Tipo} em {imovel.Bairro}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${imovel.Finalidade === 'Venda' ? 'bg-blue-500' : 'bg-orange-500'}`}>{imovel.Finalidade}</span>
                </div>
                <p className="text-sm text-gray-600">{imovel.Cidade} - {imovel.Estado}</p>
                <div className="mt-2 text-sm">
                  <p>Valor: {formatCurrency(imovel.Valor)}</p>
                  <p>{imovel.Dormitorios} dorms{imovel.Metragem && ` • ${imovel.Metragem} m²`}</p>
                </div>
                {imovel.detalhes_privados && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-start text-xs text-gray-500">
                          <Lock size={12} className="mr-2 mt-0.5 flex-shrink-0" />
                          <p><span className="font-semibold">Notas Privadas:</span> {imovel.detalhes_privados}</p>
                      </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-2 py-1 rounded-full text-white text-sm ${imovel.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{imovel.Status}</span>
                  <div className="flex space-x-2 items-center">
                    {imovel.Status === 'Ativo' && (
                      <button onClick={() => handleBuscarMatch(imovel)} disabled={findingMatch === imovel.ID_Imovel} className="text-gray-500 hover:text-secondary p-1 disabled:opacity-50 disabled:cursor-wait" title="Buscar Match">
                        {findingMatch === imovel.ID_Imovel ? <Spinner size="sm" /> : <Search size={20} />}
                      </button>
                    )}
                    <button onClick={() => handleEdit(imovel)} className="text-gray-500 hover:text-primary p-1"><Edit size={20} /></button>
                    {imovel.Status === ImovelStatus.Ativo && (
                        <button onClick={() => handleDeleteClick(imovel)} className="text-gray-500 hover:text-destructive p-1" title="Excluir Imóvel">
                            <Trash2 size={20} />
                        </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        <AddImovelModal isOpen={isImovelModalOpen} onClose={handleCloseModal} onSave={handleSaveImovel} imovelToEdit={editingImovel} />
        <ConfirmationModal
            isOpen={confirmationConfig.isOpen}
            onClose={handleCloseConfirmation}
            onConfirm={confirmationConfig.onConfirm}
            title={confirmationConfig.title}
            message={confirmationConfig.message}
            isDestructive={confirmationConfig.isDestructive}
            confirmText={confirmationConfig.confirmText}
        />
    </div>
  );
};

export default ImoveisPage;