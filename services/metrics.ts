import { supabase } from '../src/integrations/supabase/client';
import { Metric } from '../types';

export interface PlatformStats {
    total_corretores: number;
    total_imoveis_ativos: number;
    total_clientes_ativos: number;
    total_parcerias: number;
}

export const getMetricas = async (cidade?: string, estado?: string, startDate: string | null = null): Promise<Metric[]> => {
    const { data, error } = await supabase.rpc('get_corretor_metrics', {
        p_cidade: cidade,
        p_estado: estado,
        p_start_date: startDate, // Passa null se for Hall da Fama
    });

    if (error) {
        console.error('Error fetching metrics:', error);
        throw error;
    }
    
    return data as Metric[];
};

export const getPlatformStats = async (cidade?: string, estado?: string): Promise<PlatformStats> => {
    const { data, error } = await supabase.rpc('get_platform_stats', {
        p_cidade: cidade,
        p_estado: estado,
    }).single();

    if (error) {
        console.error('Error fetching platform stats:', error);
        throw error;
    }

    return data as PlatformStats;
};