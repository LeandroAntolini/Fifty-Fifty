import React, { useState, useEffect, useCallback } from 'react';
import { Parceria, Imovel, Cliente } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';

interface AugmentedParceria extends Parceria {
  imovel: Imovel | undefined;
  cliente: Cliente | undefined;
  otherCorretorName: string;
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
            const [
                parceriasData,
                imoveisData,
                clientesData,
                corretoresData
            ] = await Promise.all([
                api.getParceriasByCorretor(user.corretorInfo.ID_Corretor),
                api.getImoveis(),
                api.getClientes(),
                api.getCorretores(),
            ]);

            const imoveisMap = new Map(imoveisData.map(i => [i.ID_Imovel, i]));
            const clientesMap = new Map(clientesData.map(c => [c.ID_Cliente, c]));
            const corretoresMap = new Map(corretoresData.map(c => [c.ID_Corretor, c.Nome]));

            const augmented = parceriasData.map(parceria => {
                const imovel = imoveisMap.get(parceria.ID_Imovel);
                const cliente = clientesMap.get(parceria.ID_Cliente);

                const myId = user.corretorInfo.ID_Corretor;
                const otherCorretorId = parceria.CorretorA_ID === myId ? parceria.CorretorB_ID : parceria.CorretorA_ID;
                const otherCorretorName = corretoresMap.get(otherCorretorId) || 'Corretor Desconhecido';

                return { ...parceria, imovel, cliente, otherCorretorName };
            });

            setParcerias(augmented);

        } catch (error) {
            console.error("Failed to fetch parcerias", error);
            alert("Não foi possível carregar as parcerias.");
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
                parcerias.map(parceria => {
                    if (!parceria.imovel || !parceria.cliente) {
                        return null; 
                    }
                    return (
                        <div key={parceria.ID_Parceria} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Parceria com {parceria.otherCorretorName}
                                    </p>
                                    <h3 className="font-bold text-lg text-primary">{parceria.imovel.Tipo} - {parceria.imovel.Bairro}</h3>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded-full text-white capitalize bg-accent">{parceria.Status}</span>
                            </div>
                            <div className="mt-2 text-sm text-neutral-dark space-y-1">
                                <p><span className="font-semibold">Imóvel:</span> {parceria.imovel.Dormitorios} dorms, {formatCurrency(parceria.imovel.Valor)}</p>
                                <p><span className="font-semibold">Data:</span> {new Date(parceria.DataFechamento).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ParceriasPage;