import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const ACTION_PROMPTS: Record<string, string> = {
  résumer: 'Fais un résumé très concis de cette note en 3 bullet points. Réponds uniquement avec le résumé, sans introduction.',
  tâches: 'Extrais toutes les actions ou tâches mentionnées dans le texte et renvoie une liste à cocher markdown (ex: "- [ ] Tâche 1"). Réponds uniquement avec la liste.',
  réflexion: 'Agis comme un coach neutre. Lis la note, souligne un schéma psychologique intéressant, et pose une question ouverte pour aider l\'auteur à avancer. Réponds en 2 courtes phrases puis la question.',
  tags: 'Renvoie uniquement un tableau JSON de 3 à 5 tags (un seul mot chacun) pertinents pour classer cette note. Format: ["tag1","tag2","tag3"]. Pas d\'autre texte.',
};

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
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwt = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user?.id) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const noteText = (body.note_text || body.text || '').trim();
    const actionType = body.action_type || 'résumer';

    if (!noteText || noteText.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Le texte de la note est trop court ou invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = ACTION_PROMPTS[actionType] || ACTION_PROMPTS.résumer;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profil introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const credits = typeof profile.ai_credits === 'number' ? profile.ai_credits : 15;
    if (credits <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Crédits IA épuisés',
          code: 'CREDITS_EXHAUSTED',
          message: 'Passez à la version Premium pour continuer à utiliser l’assistant IA.',
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ai_credits: Math.max(0, credits - 1) })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update credits:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour des crédits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        system: systemPrompt,
        messages: [{ role: 'user', content: noteText }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l’appel à l’IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text?.trim() || '';

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Réponse vide de l’IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result = content;
    if (actionType === 'tags') {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const arr = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        result = Array.isArray(arr) ? arr.map((t: string) => String(t).trim()).filter(Boolean) : content;
      } catch {
        result = content;
      }
    }

    return new Response(
      JSON.stringify({
        result: typeof result === 'object' ? result : result,
        action_type: actionType,
        credits_remaining: credits - 1,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('journal-assistant error:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
