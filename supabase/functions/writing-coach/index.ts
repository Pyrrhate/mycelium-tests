import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `Tu es un Éditeur en Chef et un Coach d'écriture bienveillant mais exigeant. Ton rôle est d'aider l'auteur à structurer sa pensée. L'utilisateur va te donner son contexte et un brouillon.

RÈGLE ABSOLUE : TU NE DOIS SOUS AUCUN PRÉTEXTE ÉCRIRE OU RÉÉCRIRE LE TEXTE À SA PLACE. NE GÉNÈRE PAS DE PARAGRAPHES DE CONTENU.
Tu ne fournis pas de texte prêt à publier. Tu ne fais pas de reformulation phrase par phrase.

Ta mission est uniquement de donner des conseils d'architecture, de clarté, de progression logique et de ton.

Format attendu (concis, en bullet points) :
- "Structure suggérée : ... (avec des placeholders [X], [Y])"
- "Conseil sur le ton : ..."
- "Idée : ..."

Sois concis, clair, professionnel, et utilise des bullet points.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const context = String(body?.context || '').trim();
    const content = String(body?.content || '').trim();

    if (!content || content.length < 20) {
      return new Response(JSON.stringify({ error: 'Le brouillon est trop court ou invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profil introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.is_premium !== true) {
      return new Response(
        JSON.stringify({
          error: 'Un abonnement Premium est requis pour cette action.',
          code: 'PREMIUM_REQUIRED',
          message: 'Un abonnement Premium est requis pour cette action.',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Configuration API manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userMessage = `CONTEXTE (optionnel) :\n${context || '(non précisé)'}\n\n---\n\nBROUILLON (à analyser, ne pas réécrire) :\n${content}`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'Erreur lors de l’appel à l’IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const result = data.content?.[0]?.text?.trim() || '';

    if (!result) {
      return new Response(JSON.stringify({ error: 'Réponse vide de l’IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('writing-coach error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

