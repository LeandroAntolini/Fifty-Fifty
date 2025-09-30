// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Security check against internal trigger secret
    const INTERNAL_TRIGGER_SECRET = Deno.env.get('INTERNAL_TRIGGER_SECRET');
    if (!INTERNAL_TRIGGER_SECRET) {
        console.error("INTERNAL_TRIGGER_SECRET not set.");
        return new Response(JSON.stringify({ error: "Internal server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token !== INTERNAL_TRIGGER_SECRET) {
        return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { to_email, subject, html_content } = await req.json();
    if (!to_email || !subject || !html_content) {
      throw new Error("'to_email', 'subject', and 'html_content' are required.");
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured in Supabase secrets.");
      return new Response(JSON.stringify({ message: "Email service not configured." }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fifty-Fifty <noreply@fiftyfifty.com.br>', // Note: You'll need to verify a domain in Resend for this to work reliably.
        to: to_email,
        subject: subject,
        html: html_content,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
    }

    const responseData = await resendResponse.json();

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-email function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})