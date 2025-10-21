import { supabase } from '../src/integrations/supabase/client';
import { Cliente, ClienteStatus } from '../types';

const mapSupabaseClienteToCliente = (cliente: any): Cliente => ({
    ID_Cliente: cliente.id,
    ID_Corretor: cliente.id_corretor,
    TipoImovelDesejado: cliente.tipo_imovel_desejado,
    Finalidade: cliente.finalidade,
    CidadeDesejada: cliente.cidade_desejada,
    EstadoDesejado: cliente.estado_desejado,
    BairroRegiaoDesejada: cliente.bairro_regiao_desejada,
    FaixaValorMin: cliente.faixa_valor_min,
    FaixaValorMax: cliente.faixa_valor_max,
    DormitoriosMinimos: cliente.dormitorios_minimos,
    Status: cliente.status,
    detalhes_privados: cliente.detalhes_privados,
    CreatedAt: cliente.created_at,
});

export const getClientesByCorretor = async (corretorId: string): Promise<Cliente[]> => {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id_corretor', corretorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching clientes:', error);
        throw error;
    }

    return data.map(mapSupabaseClienteToCliente);
};

export const createCliente = async (clienteData: Omit<Cliente, 'ID_Cliente' | 'Status' | 'CreatedAt'>): Promise<Cliente> => {
    const newClienteData = {
        id_corretor: clienteData.ID_Corretor,
        tipo_imovel_desejado: clienteData.TipoImovelDesejado,
        finalidade: clienteData.Finalidade,
        cidade_desejada: clienteData.CidadeDesejada,
        estado_desejado: clienteData.EstadoDesejado,
        bairro_regiao_desejada: clienteData.BairroRegiaoDesejada,
        faixa_valor_min: clienteData.FaixaValorMin,
        faixa_valor_max: clienteData.FaixaValorMax,
        dormitorios_minimos: clienteData.DormitoriosMinimos,
        detalhes_privados: clienteData.detalhes_privados,
        status: ClienteStatus.Ativo,
    };

    const { data, error } = await supabase
        .from('clientes')
        .insert(newClienteData)
        .select()
        .single();

    if (error) {
        console.error('Error creating cliente:', error);
        throw error;
    }

    return mapSupabaseClienteToCliente(data);
};

export const updateCliente = async (clienteId: string, clienteData: Partial<Omit<Cliente, 'ID_Cliente' | 'ID_Corretor' | 'CreatedAt'>>): Promise<Cliente> => {
    const updateData = {
        tipo_imovel_desejado: clienteData.TipoImovelDesejado,
        finalidade: clienteData.Finalidade,
        cidade_desejada: clienteData.CidadeDesejada,
        estado_desejado: clienteData.EstadoDesejado,
        bairro_regiao_desejada: clienteData.BairroRegiaoDesejada,
        faixa_valor_min: clienteData.FaixaValorMin,
        faixa_valor_max: clienteData.FaixaValorMax,
        dormitorios_minimos: clienteData.DormitoriosMinimos,
        status: clienteData.Status,
        detalhes_privados: clienteData.detalhes_privados,
    };

    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', clienteId)
        .select()
        .single();

    if (error) {
        console.error('Error updating cliente:', error);
        throw error;
    }
    return mapSupabaseClienteToCliente(data);
};

export const deleteCliente = async (clienteId: string) => {
    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

    if (error) {
        console.error('Error deleting cliente:', error);
        throw error;
    }
};