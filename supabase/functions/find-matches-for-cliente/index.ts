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
    const { cliente } = await req.json()
    if (!cliente) {
      throw new Error("Cliente data is required.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find potential property matches
    const { data: potentialImoveis, error: imoveisError } = await supabaseAdmin
      .from('imoveis')
      .select('*')
      .eq('status', 'Ativo')
      .eq('finalidade', cliente.Finalidade)
      .eq('cidade', cliente.CidadeDesejada)
      .gte('valor', cliente.FaixaValorMin)
      .lte('valor', cliente.FaixaValorMax)
      .gte('dormitorios', cliente.DormitoriosMinimos)
      .neq('id_corretor', cliente.ID_Corretor); // Don't match with own properties

    if (imoveisError) throw imoveisError;
    if (!potentialImoveis || potentialImoveis.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Check for existing matches for these pairs
    const imovelIds = potentialImoveis.map(i => i.id);
    const { data: existingMatches, error: existingMatchesError } = await supabaseAdmin
      .from('matches')
      .select('id_imovel, id_cliente')
      .eq('id_cliente', cliente.ID_Cliente)
      .in('id_imovel', imovelIds);

    if (existingMatchesError) throw existingMatchesError;

    const existingPairs = new Set(existingMatches.map(m => `${m.id_imovel}-${m.id_cliente}`));

    // 3. Filter out existing matches and prepare new matches for insertion
    const newMatchesToInsert = potentialImoveis
      .filter(imovel => !existingPairs.has(`${imovel.id}-${cliente.ID_Cliente}`))
      .map(imovel => ({
        id_imovel: imovel.id,
        id_cliente: cliente.ID_Cliente,
        id_corretor_imovel: imovel.id_corretor,
        id_corretor_cliente: cliente.ID_Corretor,
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