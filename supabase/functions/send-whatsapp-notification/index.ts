import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NOTA: Esta função usa a API do WhatsApp Business.
// Você DEVE configurar seus secrets no painel do Supabase:
// 1. WHATSAPP_API_TOKEN: Seu token de acesso da API da Meta.
// 2. WHATSAPP_PHONE_NUMBER_ID: O ID do número de telefone que enviará a mensagem.

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to_phone, message_text, link } = await req.json()
    if (!to_phone || !message_text) {
      throw new Error("'to_phone' e 'message_text' são obrigatórios.")
    }

    const WHATSAPP_API_TOKEN = Deno.env.get('WHATSAPP_API_TOKEN');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error("Secrets do WhatsApp não configurados no Supabase.");
      // Em um ambiente real, você pode querer não falhar silenciosamente.
      // Por enquanto, retornamos sucesso para não quebrar o fluxo do banco de dados.
      return new Response(JSON.stringify({ message: "Configuração do WhatsApp incompleta." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const full_message = `${message_text}\n\nAcesse aqui: ${link}`;
    
    // Formata o número para o padrão internacional (assumindo que já vem com código do país, ex: 5511999999999)
    const formattedPhoneNumber = to_phone.replace(/\D/g, '');

    const response = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhoneNumber,
        type: "text",
        text: {
          body: full_message
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro da API do WhatsApp: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Erro na função send-whatsapp-notification:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})