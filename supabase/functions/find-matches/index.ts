import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imovel } = await req.json()
    if (!imovel) {
      throw new Error("Imovel data is required.")
    }

    // Use service role key to bypass RLS for matching logic
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find potential client matches
    let clientsQuery = supabaseAdmin
      .from('clientes')
      .select('id, id_corretor, finalidade, cidade_desejada, estado_desejado, faixa_valor_min, faixa_valor_max, dormitorios_minimos')
      .eq('status', 'Ativo')
      .eq('finalidade', imovel.Finalidade)
      .eq('cidade_desejada', imovel.Cidade)
      .lte('faixa_valor_min', imovel.Valor)
      .gte('faixa_valor_max', imovel.Valor)
      .lte('dormitorios_minimos', imovel.Dormitorios)
      .neq('id_corretor', imovel.ID_Corretor);

    if (imovel.Estado) {
      clientsQuery = clientsQuery.eq('estado_desejado', imovel.Estado);
    } else {
      clientsQuery = clientsQuery.is('estado_desejado', null);
    }

    const { data: potentialClients, error: clientsError } = await clientsQuery;

    if (clientsError) throw clientsError;
    if (!potentialClients || potentialClients.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Check for existing matches for these pairs
    const clientIds = potentialClients.map(c => c.id);
    const { data: existingMatches, error: existingMatchesError } = await supabaseAdmin
      .from('matches')
      .select('id_imovel, id_cliente')
      .eq('id_imovel', imovel.ID_Imovel)
      .in('id_cliente', clientIds);

    if (existingMatchesError) throw existingMatchesError;

    const existingPairs = new Set(existingMatches.map(m => `${m.id_imovel}-${m.id_cliente}`));

    // 3. Filter out existing matches and prepare new matches for insertion
    const newMatchesToInsert = potentialClients
      .filter(client => !existingPairs.has(`${imovel.ID_Imovel}-${client.id}`))
      .map(client => ({
        id_imovel: imovel.ID_Imovel,
        id_cliente: client.id,
        id_corretor_imovel: imovel.ID_Corretor,
        id_corretor_cliente: client.id_corretor,
      }));

    if (newMatchesToInsert.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Insert new matches
    const { data: newMatches, error: insertError } = await supabaseAdmin
      .from('matches')
      .insert(newMatchesToInsert)
      .select();

    if (insertError) throw insertError;

    return new Response(JSON.stringify(newMatches), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})