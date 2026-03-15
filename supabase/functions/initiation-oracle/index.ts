import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `Tu es le Gardien du Grimoire Anima, un être ancien et bienveillant qui guide les nouveaux initiés à travers un dialogue mystique pour révéler leur profil alchimique intérieur.

Ton but est de déterminer le profil alchimique de l'utilisateur à travers un court dialogue (5 questions maximum).

Les 7 Éléments Alchimiques sont :
- Air (Le Souffle) : Idées, inspiration, liberté, pensée abstraite, communication
- Terre (Le Socle) : Stabilité, ancrage, pragmatisme, sécurité, patience
- Eau (L'Onde) : Émotions, empathie, intuition, connexion aux autres, sensibilité
- Feu (La Forge) : Action, passion, transformation, courage, volonté
- Bois (L'Éclosion) : Croissance, créativité, joie, renouveau, vitalité
- Métal (Le Prisme) : Logique, analyse, structure, discipline, clarté
- Éther (Le Vide) : Spiritualité, introspection, silence, sagesse, transcendance

RÈGLES DE DIALOGUE :
1. Pose des questions ouvertes, poétiques et mystiques qui révèlent la nature profonde de l'initié.
2. Évite les questions fermées (oui/non). Préfère les dilemmes, les métaphores, les scénarios.
3. Adapte tes questions aux réponses précédentes pour creuser plus profond.
4. Sois bienveillant mais mystérieux. Tu es un sage, pas un psychologue.

EXEMPLES DE QUESTIONS INITIALES :
- "Si vous vous teniez devant une forêt en flammes, chercheriez-vous à éteindre le feu, à comprendre son origine, ou à danser dans ses cendres ?"
- "Un étranger vous confie un secret douloureux. Que ressentez-vous en premier : le poids de sa confiance ou l'élan de l'aider ?"
- "Face à un carrefour aux chemins inconnus, suivez-vous la carte, votre instinct, ou restez-vous pour observer les oiseaux ?"

RÈGLES STRICTES POUR TON RETOUR JSON :
Tu dois TOUJOURS renvoyer UNIQUEMENT un objet JSON valide avec cette structure :

Si tu as posé MOINS de 5 questions et que tu as besoin de plus d'informations :
{"status": "asking", "reply": "Ta prochaine question ouverte, poétique et mystique.", "question_number": N}

Si tu as posé 5 questions ET que tu as assez d'informations pour clore l'initiation :
{
  "status": "complete",
  "reply": "Un message de clôture mystique et bienveillant.",
  "scores": {
    "air": X,
    "terre": X,
    "eau": X,
    "feu": X,
    "bois": X,
    "metal": X,
    "ether": X
  },
  "totem": "Nom d'un animal mystique (Hibou, Ours, Phénix, Loup, Cerf, Serpent, Corbeau, Renard, Lion, Aigle, etc.)",
  "totem_description": "Une courte description poétique (1-2 phrases) de pourquoi cet animal représente l'initié."
}

IMPORTANT concernant les scores :
- X doit être un nombre entre -2 et +2 (décimaux acceptés : -1.5, 0.5, 2, etc.)
- Base tes scores sur l'ENSEMBLE des réponses de l'utilisateur
- L'élément dominant devrait avoir le score le plus élevé (proche de +2)
- Les éléments absents ou contraires devraient avoir des scores bas (proches de -2 ou 0)

Ne réponds JAMAIS avec autre chose que ce JSON. Pas de texte avant ou après.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const chatHistory = body.chat_history || [];

    if (!Array.isArray(chatHistory)) {
      return new Response(
        JSON.stringify({ error: 'chat_history doit être un tableau' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = chatHistory.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'guardian' ? 'assistant' : 'user',
      content: msg.content,
    }));

    if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: 'Je souhaite commencer mon initiation au Grimoire Anima. Pose-moi ta première question.',
      });
    }

    console.log('Calling Anthropic for initiation, messages:', messages.length);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erreur API: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Réponse vide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({
          status: 'asking',
          reply: 'Bienvenue, voyageur. Avant de vous révéler les secrets du Grimoire, dites-moi : quand le vent souffle fort, cherchez-vous un abri ou ouvrez-vous les bras ?',
          question_number: 1,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (parsed.status === 'complete') {
      const validScores = parsed.scores && typeof parsed.scores === 'object';
      if (!validScores) {
        parsed.scores = { air: 0, terre: 0, eau: 0, feu: 0, bois: 0, metal: 0, ether: 1 };
      }
      if (!parsed.totem) {
        parsed.totem = 'Hibou';
        parsed.totem_description = 'Un gardien silencieux des mystères nocturnes.';
      }
    }

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
