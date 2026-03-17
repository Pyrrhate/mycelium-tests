import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OCR_SYSTEM = `Tu es un expert en transcription. L'utilisateur te fournit une image de notes manuscrites. Ta seule tâche est de retranscrire le texte exactement comme il est écrit, en conservant les paragraphes et les listes. Ne rajoute aucun commentaire, renvoie uniquement le texte transcrit.`;

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

    const body = await req.json();
    let imageBase64: string;
    let mediaType = 'image/jpeg';

    if (body.image_base64) {
      imageBase64 = body.image_base64.replace(/^data:image\/\w+;base64,/, '');
      if (body.media_type) mediaType = body.media_type;
    } else if (body.image_url) {
      const imageResponse = await fetch(body.image_url, {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (!imageResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Impossible de récupérer l\'image' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const blob = await imageResponse.blob();
      const buf = await blob.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      mediaType = blob.type || 'image/jpeg';
    } else {
      return new Response(
        JSON.stringify({ error: 'Fournissez image_url ou image_base64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: OCR_SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Transcris le contenu de cette image.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic OCR error:', response.status, errText);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la transcription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() ?? '';

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ocr-vision error:', err);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
