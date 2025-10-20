import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Corretor } from '../types';
import { User as UserIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface AugmentedParceria {
    ID_Parceria: string;
    DataFechamento: string;
    Status: string;
    imovel_tipo: string;
    imovel_bairro: string;
    imovel_valor: number;
    imovel_dormitorios: number;
    other_corretor_name: string;
}

const ConexoesPage: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    // Inicializa a aba baseada no query parameter 'tab'
    const initialTab = new URLSearchParams(location.search).get('tab') === 'seguindo' ? 'seguindo' : 'parcerias';
    
    const [activeTab, setActiveTab] = useState<'parcerias' | 'seguindo'>(initialTab);
    const [parcerias, setParcerias] = useState<AugmentedParceria[]>([]);
    const [seguindo, setSeguindo] = useState<Partial<Corretor>[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const fetchData = useCallback(async (currentTab: 'parcerias' | 'seguindo') => {
        if (!user) return;
        setLoading(true);
        try {
            if (currentTab === 'parcerias') {
                const augmentedData = await api.getAugmentedParceriasByCorretor(user.id);
                setParcerias(augmentedData || []);
            } else {
                const followingData = await api.getFollowingList(user.id);
                setSeguindo(followingData || []);
            }
        } catch (error) {
            console.error(`Failed to fetch ${currentTab}`, error);
            toast.error(`Não foi possível carregar ${currentTab === 'parcerias' ? 'as parcerias' : 'suas conexões'}.`);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Quando o componente monta ou o location.search muda (navegação externa), atualiza a aba
        const newTab = new URLSearchParams(location.search).get('tab') === 'seguindo' ? 'seguindo' : 'parcerias';
        setActiveTab(newTab);
    }, [location.search]);

    useEffect(() => {
        // Sempre que activeTab mudar (seja por clique interno ou navegação externa), busca os dados
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const handleUnfollow = async (corretorId: string) => {
        if (!user) return;
        try {
            await api.unfollowCorretor(user.id, corretorId);
            toast.success("Você deixou de seguir o corretor.");
            fetchData(activeTab); // Refresh the list
        } catch (error) {
            toast.error("Não foi possível deixar de seguir.");
        }
    };

    const renderParcerias = () => (
        <div className="space-y-4">
            {parcerias.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Nenhuma parceria concluída.</p>
                    <p className="text-sm text-gray-400 mt-2">Quando você e outro corretor finalizarem um negócio, a parceria aparecerá aqui.</p>
                </div>
            ) : (
                parcerias.map(parceria => (
                    <div key={parceria.ID_Parceria} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Parceria com {parceria.other_corretor_name}
                                </p>
                                <h3 className="font-bold text-lg text-primary">{parceria.imovel_tipo} - {parceria.imovel_bairro}</h3>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full text-white capitalize bg-accent">{parceria.Status}</span>
                        </div>
                        <div className="mt-2 text-sm text-neutral-dark space-y-1">
                            <p><span className="font-semibold">Imóvel:</span> {parceria.imovel_dormitorios} dorms, {formatCurrency(parceria.imovel_valor)}</p>
                            <p><span className="font-semibold">Data:</span> {new Date(parceria.DataFechamento).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderSeguindo = () => (
        <div className="space-y-2">
            {seguindo.length === 0 ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">
                    <p className="text-gray-600">Você não está seguindo nenhum corretor.</p>
                    <p className="text-sm text-gray-400 mt-2">Use o botão "Seguir" nos chats para adicionar corretores aqui.</p>
                </div>
            ) : (
                seguindo.map(corretor => (
                    <div key={corretor.ID_Corretor} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {corretor.avatar_url ? (
                                <img src={corretor.avatar_url} alt={corretor.Nome} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-500" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-primary">{corretor.Nome}</p>
                                <p className="text-sm text-gray-500">{corretor.Cidade} - {corretor.Estado}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => corretor.ID_Corretor && handleUnfollow(corretor.ID_Corretor)}>
                            Deixar de Seguir
                        </Button>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-center space-x-2 bg-white p-2 rounded-lg shadow">
                <Button size="sm" variant={activeTab === 'parcerias' ? 'default' : 'ghost'} onClick={() => setActiveTab('parcerias')}>Parcerias</Button>
                <Button size="sm" variant={activeTab === 'seguindo' ? 'default' : 'ghost'} onClick={() => setActiveTab('seguindo')}>Seguindo</Button>
            </div>
            {loading ? (
                <div className="flex justify-center mt-8"><Spinner /></div>
            ) : (
                activeTab === 'parcerias' ? renderParcerias() : renderSeguindo()
            )}
        </div>
    );
};

export default ConexoesPage;