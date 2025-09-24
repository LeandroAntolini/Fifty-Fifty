import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

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

const ParceriasPage: React.FC = () => {
    const { user } = useAuth();
    const [parcerias, setParcerias] = useState<AugmentedParceria[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    const fetchParcerias = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const augmentedData = await api.getAugmentedParceriasByCorretor(user.corretorInfo.ID_Corretor);
            setParcerias(augmentedData || []);
        } catch (error) {
            console.error("Failed to fetch parcerias", error);
            toast.error("Não foi possível carregar as parcerias.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchParcerias();
    }, [fetchParcerias]);

    if (loading) {
        return <div className="flex justify-center mt-8"><Spinner /></div>;
    }

    return (
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
};

export default ParceriasPage;