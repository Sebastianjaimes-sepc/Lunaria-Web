// Supabase Edge Function: lumi
// Runtime: Deno (edge)
// Responsabilidad: recibir mensajes del cliente, verificar rate limit,
// llamar a Claude API y devolver la respuesta.
//
// Variables de entorno requeridas en Supabase Dashboard:
//   HF_API_TOKEN        → tu API token de Hugging Face
//   SUPABASE_URL        → inyectada automáticamente por Supabase
//   SUPABASE_SERVICE_ROLE_KEY → inyectada automáticamente

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HF_API_TOKEN = Deno.env.get('HF_API_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAX_CALLS_PER_DAY = 20;
const MODEL = 'Qwen/Qwen3-8B:nscale';

interface RequestBody {
  user_id: string;
  message: string;
  system_prompt: string;
  history: Array<{ role: string; content: string }>;
  context_snapshot: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  try {
    console.log('lumi invoked', { method: req.method, url: req.url });

    // Do not log secrets; only presence indicators
    console.log('env presence', {
      SUPABASE_URL: Boolean(SUPABASE_URL),
      SUPABASE_SERVICE_KEY: Boolean(SUPABASE_SERVICE_KEY),
      HF_API_TOKEN: Boolean(HF_API_TOKEN),
    });

    const body: RequestBody = await req.json();
    const { user_id, message, system_prompt, history, context_snapshot } = body;

    console.log('lumi body', { user_id, messagePreview: String(message).slice(0,200), historyLength: history?.length ?? 0 });

    if (!user_id || !message) {
      console.error('Validation error: missing user_id or message', { user_id, hasMessage: Boolean(message) });
      return jsonError('user_id y message son requeridos', 400);
    }

    if (!SUPABASE_SERVICE_KEY) {
      console.error('Missing SUPABASE_SERVICE_KEY in env');
      return jsonError('Missing SUPABASE_SERVICE_ROLE_KEY', 500);
    }

    // Cliente con service role para bypasear RLS en funciones del servidor
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Verificar y actualizar rate limit (atómico)
    console.log('calling rpc increment_lumi_usage', { user_id });
    const { data: countData, error: countError } = await supabase
      .rpc('increment_lumi_usage', { p_user_id: user_id });

    console.log('increment_lumi_usage result', { countData, countError });

    if (countError) {
      console.error('Rate limit error (rpc increment_lumi_usage):', countError);
      return jsonError('Error verificando límite de uso', 500);
    }

    const llamadasHoy = countData as number;

    if (llamadasHoy > MAX_CALLS_PER_DAY) {
      console.warn('Daily limit reached', { llamadasHoy, max: MAX_CALLS_PER_DAY });
      return jsonError(
        'Lumi descansa por hoy. Vuelve mañana con nuevas preguntas.',
        429
      );
    }

    // 2. Llamar a Hugging Face
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    if (!HF_API_TOKEN) {
      console.error('Missing HF_API_TOKEN in env');
      return jsonError('Missing HF_API_TOKEN', 500);
    }

    console.log('calling Hugging Face', { model: MODEL, messagesLength: messages.length });

    const hfRes = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'system',
              content: system_prompt,
            },
            ...messages,
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    console.log('huggingface response status', { status: hfRes.status, statusText: hfRes.statusText });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error('Hugging Face API error:', { status: hfRes.status, body: errText });
      return json({ error: 'Hugging Face API error', details: errText }, hfRes.status);
    }

    const hfData = await hfRes.json();
    const reply =
      hfData?.choices?.[0]?.message?.content ??
      'Lo siento, no pude generar una respuesta.';

    // 3. Guardar mensajes en la DB
    console.log('inserting lumi_mensajes', { user_id, messagePreview: String(message).slice(0,200), replyPreview: reply.slice(0,200) });

    const insertRes = await supabase.from('lumi_mensajes').insert([
      {
        user_id,
        rol: 'user',
        contenido: message,
        contexto_snap: context_snapshot,
      },
      {
        user_id,
        rol: 'assistant',
        contenido: reply,
        contexto_snap: null,
      },
    ]);

    console.log('lumi_mensajes insert result', insertRes);

    if ((insertRes as any).error) {
      console.error('Insert lumi_mensajes error', (insertRes as any).error);
      return jsonError('Error guardando mensajes', 500);
    }

    return json({ reply, llamadas_hoy: llamadasHoy });
  } catch (err) {
    console.error('Unhandled error:', err);
    return jsonError('Error interno del servidor', 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}
