import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `Tu es un correcteur orthographique et grammatical professionnel (Proofreader). Ton seul et unique but est de corriger les fautes d'orthographe, de grammaire, de syntaxe et de typographie du texte fourni.

RÈGLES ABSOLUES :
- NE CHANGE PAS le ton, le style, ni le vocabulaire de l'auteur, sauf si un mot est mal employé.
- NE RAJOUTE PAS de texte, de commentaires ou d'introduction (ne dis pas "Voici la correction :").
- Renvoie UNIQUEMENT le texte corrigé, prêt à remplacer l'original.`;

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
    const selectedText = String(body?.selected_text || '').trim();
    if (!selectedText || selectedText.length < 2) {
      return new Response(JSON.stringify({ error: 'Texte sélectionné invalide.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_credits, is_premium')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profil introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPremium = profile.is_premium === true;
    const credits = typeof profile.ai_credits === 'number' ? profile.ai_credits : 15;

    if (!isPremium && credits <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Crédits IA épuisés',
          code: 'CREDITS_EXHAUSTED',
          message: 'Passez à la version Premium pour continuer à utiliser la correction IA.',
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Décrémenter 1 crédit seulement si non premium
    if (!isPremium) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ ai_credits: Math.max(0, credits - 1) })
        .eq('id', user.id);
      if (updateError) {
        return new Response(JSON.stringify({ error: 'Erreur lors de la mise à jour des crédits' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Configuration API manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: selectedText }],
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

    return new Response(
      JSON.stringify({
        result,
        credits_remaining: isPremium ? credits : Math.max(0, credits - 1),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('ai-proofread error:', err);
    return new Response(JSON.stringify({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

