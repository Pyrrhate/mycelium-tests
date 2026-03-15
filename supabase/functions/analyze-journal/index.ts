import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `Tu es le Mycélium, un compagnon introspectif bienveillant. Tu es l'esprit d'une forêt alchimique ancestrale qui accompagne les initiés dans leur voyage intérieur.

L'utilisateur t'envoie ses pensées passées (jusqu'à 3 notes sélectionnées intelligemment) et sa note du jour. Agis comme un miroir bienveillant. Ne donne JAMAIS de leçons. Ne juge pas. Tu observes, tu reflètes, tu questionnes doucement.

Tu as accès à des pensées passées de l'utilisateur. Ton but n'est pas seulement de réagir à la note du jour, mais de TISSER DES LIENS. Si la note actuelle résonne avec une note passée, fais-le remarquer subtilement.

Ton rôle :
1. Analyser le CONTEXTE GLOBAL : compare la note du jour aux notes passées. Y a-t-il une évolution ? Une récurrence ? Un changement d'état ?
2. TISSER DES LIENS ORGANIQUES : Si tu détectes une connexion entre la note actuelle et une note passée (thème récurrent, évolution, contraste), note-le dans mycelium_link.
3. Identifier l'élément alchimique DOMINANT de l'émotion ACTUELLE parmi les 7 :
   - Feu : passion, colère, motivation intense, désir ardent
   - Eau : calme, tristesse, mélancolie, fluidité émotionnelle
   - Terre : stabilité, fatigue, ancrage, besoin de repos
   - Air : anxiété, mental agité, questionnements, confusion
   - Bois : croissance, joie, créativité, renouveau
   - Métal : clarté, rigueur, lâcher-prise, deuil, décision
   - Éther : spiritualité, vide, méditation, quête de sens

Tu dois TOUJOURS répondre UNIQUEMENT avec un objet JSON strict contenant exactement 4 clés :
- "element": un des 7 éléments (Feu, Eau, Terre, Air, Bois, Métal, Éther)
- "quote": une citation philosophique ou poétique COURTE (1-2 lignes max) qui résonne avec l'état émotionnel actuel. Peut être de Rumi, Lao Tseu, Khalil Gibran, Epictète, Marc Aurèle, ou une sagesse ancestrale.
- "reflection": une question ouverte d'introspection (UNE seule question) basée sur l'évolution entre les notes passées et celle d'aujourd'hui.
- "mycelium_link": une réflexion comparative COURTE (1-2 phrases) si tu as détecté un lien avec une note passée. Exemples : "Je vois que cette étincelle de créativité fait écho à ton inspiration du 15 mars." ou "Cette fatigue contraste avec l'énergie débordante que tu exprimais la semaine dernière." Si aucun lien n'est détecté, utilise null.

IMPORTANT :
- Si pas de notes passées, base ta réflexion uniquement sur la note actuelle et mets mycelium_link à null.
- La question de réflexion doit être personnalisée et montrer que tu as "lu" les notes.
- Ne réponds JAMAIS avec autre chose que ce JSON. Pas d'introduction, pas d'explication.
- Sois poétique mais pas pompeux. Sois profond mais accessible.`;

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
    
    // Support ancien format (text) et nouveau format (current_entry + past_entries)
    const currentEntry = body.current_entry || body.text;
    const pastEntries = body.past_entries || [];

    if (!currentEntry || typeof currentEntry !== 'string' || currentEntry.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Le texte est trop court ou invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire le message utilisateur avec contexte
    let userMessage = '';
    
    if (pastEntries.length > 0) {
      userMessage += '=== NOTES PASSÉES (mémoire courte) ===\n\n';
      pastEntries.forEach((entry: { text: string; element?: string; date?: string }, index: number) => {
        const dateStr = entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : `Note ${index + 1}`;
        userMessage += `[${dateStr}]${entry.element ? ` (${entry.element})` : ''}\n${entry.text}\n\n`;
      });
      userMessage += '=== NOTE DU JOUR ===\n\n';
    }
    
    userMessage += currentEntry.trim();
    userMessage += '\n\n---\nAnalyse cette note dans son contexte et réponds avec le JSON demandé.';

    console.log('Calling Anthropic API with key:', apiKey.substring(0, 20) + '...');
    
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error status:', response.status);
      console.error('Anthropic API error body:', errorText);
      return new Response(
        JSON.stringify({ error: `Erreur API: ${response.status} - ${errorText.substring(0, 200)}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Réponse vide de l\'IA' }),
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
          element: 'Éther',
          quote: '« Dans le silence, l\'âme trouve sa voix. »',
          reflection: 'Qu\'est-ce que ce moment de confusion cherche à vous révéler ?',
          mycelium_link: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validElements = ['Feu', 'Eau', 'Terre', 'Air', 'Bois', 'Métal', 'Éther'];
    if (!validElements.includes(parsed.element)) {
      parsed.element = 'Éther';
    }

    return new Response(
      JSON.stringify({
        element: parsed.element,
        quote: parsed.quote || '« Le chemin se révèle à celui qui marche. »',
        reflection: parsed.reflection || 'Qu\'est-ce que votre cœur cherche vraiment à exprimer ?',
        mycelium_link: parsed.mycelium_link || null,
      }),
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
