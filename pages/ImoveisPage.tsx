import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Imovel, ImovelStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddImovelModal, { ImageChanges } from '../components/AddImovelModal';
import { Edit, Trash2, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';
import { Button } from '../components/ui/Button';
import ConfirmationModal from '../components/ConfirmationModal';

type SortCriteria = 'newest' | 'oldest' | 'highest_value' | 'lowest_value';

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
  const [findingMatch, setFindingMatch] = useState<string | null>(null);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  const [imovelToDelete, setImovelToDelete] = useState<Imovel | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Filter and Sort states
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [bairroFilter, setBairroFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dormitoriosFilter, setDormitoriosFilter] = useState('');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('newest');

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

  // Close sort menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const areFiltersActive = useMemo(() => {
    return !!(cidadeFilter || bairroFilter || estadoFilter || valorMinFilter || valorMaxFilter || dormitoriosFilter);
  }, [cidadeFilter, bairroFilter, estadoFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter]);

  const clearFilters = () => {
    setCidadeFilter('');
    setBairroFilter('');
    setEstadoFilter('');
    setValorMinFilter('');
    setValorMaxFilter('');
    setDormitoriosFilter('');
  };

  const processedImoveis = useMemo(() => {
    const filtered = imoveis.filter(imovel => {
      const valorMin = parseFloat(valorMinFilter);
      const valorMax = parseFloat(valorMaxFilter);
      const dormitorios = parseInt(dormitoriosFilter, 10);

      return (
        (cidadeFilter === '' || imovel.Cidade.toLowerCase().includes(cidadeFilter.toLowerCase())) &&
        (bairroFilter === '' || imovel.Bairro.toLowerCase().includes(bairroFilter.toLowerCase())) &&
        (estadoFilter === '' || (imovel.Estado && imovel.Estado.toLowerCase().includes(estadoFilter.toLowerCase()))) &&
        (isNaN(valorMin) || imovel.Valor >= valorMin) &&
        (isNaN(valorMax) || imovel.Valor <= valorMax) &&
        (isNaN(dormitorios) || imovel.Dormitorios >= dormitorios)
      );
    });

    return filtered.sort((a, b) => {
      if (a.Status === ImovelStatus.Ativo && b.Status !== ImovelStatus.Ativo) return -1;
      if (a.Status !== ImovelStatus.Ativo && b.Status === ImovelStatus.Ativo) return 1;
      switch (sortCriteria) {
        case 'newest': return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
        case 'oldest': return new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
        case 'highest_value': return b.Valor - a.Valor;
        case 'lowest_value': return a.Valor - b.Valor;
        default: return 0;
      }
    });
  }, [imoveis, cidadeFilter, bairroFilter, estadoFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter, sortCriteria]);

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
        api.findMatchesForImovel(savedImovel).catch(err => console.error("Background match finding failed:", err));
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

  const handleDelete = (imovel: Imovel) => {
    setImovelToDelete(imovel);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (imovelToDelete) {
      try {
        await api.deleteImovel(imovelToDelete.ID_Imovel, imovelToDelete.Imagens);
        toast.success("Imóvel excluído com sucesso.");
        fetchImoveis();
      } catch (error) {
        console.error("Failed to delete imovel", error);
        toast.error("Falha ao excluir imóvel.");
      } finally {
        setShowDeleteConfirm(false);
        setImovelToDelete(null);
      }
    }
  };

  const handleCloseModal = () => {
    setEditingImovel(null);
    closeImovelModal();
  };

  const handleBuscarMatch = async (imovel: Imovel) => {
    setFindingMatch(imovel.ID_Imovel);
    try {
        const newMatches = await api.findMatchesForImovel(imovel);
        if (newMatches.length === 0) {
            toast('Nenhum novo match encontrado para este imóvel.', { icon: '🤷' });
        }
    } catch(error) {
        toast.error("Ocorreu um erro ao buscar por matches.");
    } finally {
        setFindingMatch(null);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const sortOptions: { label: string; value: SortCriteria }[] = [
    { label: 'Recém Adicionados', value: 'newest' },
    { label: 'Mais Antigos', value: 'oldest' },
    { label: 'Maior Valor', value: 'highest_value' },
    { label: 'Menor Valor', value: 'lowest_value' },
  ];

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div>
      <div className="bg-white p-2 rounded-lg shadow mb-4 space-y-2">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full justify-center">
            <Filter size={16} className="mr-2" />
            Filtrar
            {areFiltersActive && <span className="ml-2 h-2 w-2 rounded-full bg-secondary" />}
          </Button>
          <div className="relative w-full" ref={sortMenuRef}>
            <Button variant="outline" onClick={() => setShowSortMenu(!showSortMenu)} className="w-full justify-center">
              <ArrowUpDown size={16} className="mr-2" />
              Ordenar
            </Button>
            {showSortMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSortCriteria(option.value); setShowSortMenu(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${sortCriteria === option.value ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {showFilters && (
          <div className="p-2 border-t">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Cidade" value={cidadeFilter} onChange={(e) => setCidadeFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Bairro" value={bairroFilter} onChange={(e) => setBairroFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="text" placeholder="Estado (UF)" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded text-sm" maxLength={2} />
              <input type="number" placeholder="Dorms. Mín." value={dormitoriosFilter} onChange={(e) => setDormitoriosFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="number" placeholder="Valor Mín." value={valorMinFilter} onChange={(e) => setValorMinFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
              <input type="number" placeholder="Valor Máx." value={valorMaxFilter} onChange={(e) => setValorMaxFilter(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            </div>
            <Button variant="ghost" onClick={clearFilters} className="w-full text-destructive">
              <X size={16} className="mr-2" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {processedImoveis.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum imóvel encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">{imoveis.length > 0 ? "Tente ajustar seus filtros." : "Clique no botão '+' para começar."}</p>
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
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-2 py-1 rounded-full text-white text-sm ${imovel.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{imovel.Status}</span>
                  <div className="flex space-x-2 items-center">
                    {imovel.Status === 'Ativo' && (
                      <button onClick={() => handleBuscarMatch(imovel)} disabled={findingMatch === imovel.ID_Imovel} className="text-gray-500 hover:text-secondary p-1 disabled:opacity-50 disabled:cursor-wait" title="Buscar Match">
                        {findingMatch === imovel.ID_Imovel ? <Spinner size="sm" /> : <Search size={20} />}
                      </button>
                    )}
                    <button onClick={() => handleEdit(imovel)} className="text-gray-500 hover:text-primary p-1"><Edit size={20} /></button>
                    <button onClick={() => handleDelete(imovel)} className="text-gray-500 hover:text-destructive p-1"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        <AddImovelModal isOpen={isImovelModalOpen} onClose={handleCloseModal} onSave={handleSaveImovel} imovelToEdit={editingImovel} />
        <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDelete}
            title="Confirmar Exclusão"
            message={`Tem certeza que deseja excluir o imóvel "${imovelToDelete?.Tipo} em ${imovelToDelete?.Bairro}"? Esta ação não pode ser desfeita.`}
            isDestructive
            confirmText="Excluir"
        />
    </div>
  );
};

export default ImoveisPage;