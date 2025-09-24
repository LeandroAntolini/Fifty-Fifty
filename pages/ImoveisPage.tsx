import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Imovel } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import AddImovelModal from '../components/AddImovelModal';

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
  const { isImovelModalOpen, closeImovelModal } = useUI();
  const [findingMatch, setFindingMatch] = useState<string | null>(null);

  // Filter states
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [valorMinFilter, setValorMinFilter] = useState('');
  const [valorMaxFilter, setValorMaxFilter] = useState('');
  const [dormitoriosFilter, setDormitoriosFilter] = useState('');

  const fetchImoveis = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        // FIX: Passed user.corretorInfo.ID_Corretor to getImoveisByCorretor
        const data = await api.getImoveisByCorretor(user.corretorInfo.ID_Corretor);
        setImoveis(data);
      } catch (error) {
        console.error("Failed to fetch imoveis", error);
        alert(`Não foi possível carregar os imóveis. ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchImoveis();
  }, [fetchImoveis]);

  const filteredImoveis = useMemo(() => {
    return imoveis.filter(imovel => {
      const valorMin = parseFloat(valorMinFilter);
      const valorMax = parseFloat(valorMaxFilter);
      const dormitorios = parseInt(dormitoriosFilter, 10);

      return (
        (cidadeFilter === '' || imovel.Cidade.toLowerCase().includes(cidadeFilter.toLowerCase())) &&
        (isNaN(valorMin) || imovel.Valor >= valorMin) &&
        (isNaN(valorMax) || imovel.Valor <= valorMax) &&
        (isNaN(dormitorios) || imovel.Dormitorios >= dormitorios)
      );
    });
  }, [imoveis, cidadeFilter, valorMinFilter, valorMaxFilter, dormitoriosFilter]);

  const handleAddImovel = async (formData: Omit<Imovel, 'ID_Imovel' | 'ID_Corretor' | 'Status'> & { Imagens?: string[] }) => {
    if (!user) return;
    try {
      const imovelData = {
        ...formData,
        ID_Corretor: user.corretorInfo.ID_Corretor,
      };
      await api.createImovel(imovelData);
      closeImovelModal();
      fetchImoveis(); // Refresh the list
    } catch (error) {
      console.error("Failed to create imovel", error);
      alert("Falha ao cadastrar imóvel. Tente novamente.");
    }
  };
  
  const handleBuscarMatch = async (imovel: Imovel) => {
    setFindingMatch(imovel.ID_Imovel);
    try {
        const newMatches = await api.findMatchesForImovel(imovel);
        if (newMatches.length > 0) {
            alert(`${newMatches.length} novo(s) match(s) encontrado(s)! Verifique a aba de Matches.`);
        } else {
            alert("Nenhum novo match encontrado para este imóvel no momento.");
        }
    } catch(error) {
        alert("Ocorreu um erro ao buscar por matches.");
    } finally {
        setFindingMatch(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Filtrar Imóveis</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Cidade"
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

      {filteredImoveis.length === 0 ? (
        <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-gray-600">Nenhum imóvel encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">{imoveis.length > 0 ? "Tente ajustar seus filtros." : "Clique no botão '+' para começar."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredImoveis.map(imovel => (
            <div key={imovel.ID_Imovel} className="bg-white rounded-lg shadow overflow-hidden">
              <ImageCarousel images={imovel.Imagens} alt={imovel.Tipo} />
              <div className="p-4">
                <h3 className="font-bold text-lg text-primary">{imovel.Tipo} em {imovel.Bairro}</h3>
                <p className="text-sm text-gray-600">{imovel.Cidade}</p>
                <div className="mt-2 text-sm">
                  <p>Valor: {formatCurrency(imovel.Valor)}</p>
                  <p>Dormitórios: {imovel.Dormitorios}</p>
                </div>
                <div className="mt-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-white ${imovel.Status === 'Ativo' ? 'bg-green-500' : 'bg-gray-500'}`}>{imovel.Status}</span>
                </div>
                <button
                  onClick={() => handleBuscarMatch(imovel)}
                  disabled={findingMatch === imovel.ID_Imovel}
                  className="mt-4 w-full bg-secondary hover:bg-amber-500 text-primary font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-neutral-DEFAULT"
                >
                  {findingMatch === imovel.ID_Imovel ? 'Buscando...' : 'Buscar Match'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        <AddImovelModal
            isOpen={isImovelModalOpen}
            onClose={closeImovelModal}
            onSave={handleAddImovel}
        />
    </div>
  );
};

export default ImoveisPage;