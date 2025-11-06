// supabase/functions/verify-recaptcha/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const SECRET = Deno.env.get('RECAPTCHA_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) return json({ success: false, error: 'missing-token' }, 400);

    const params = new URLSearchParams({ secret: SECRET, response: token });

    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const res = await r.json();
    return json({
      success: !!res.success,
      score: res.score ?? null,
      action: res.action ?? null,
    });
  } catch (e) {
    return json({ success: false, error: 'exception', detail: String(e) }, 500);
  }
});
