/* CALCOUNT photo scan: the server half.

   A Cloudflare Worker. It exists for one reason: the Claude API key must
   never be inside a file anyone can download. The app sends a shrunk photo
   here, this sends it on to Claude with the key, and hands back what is on
   the plate.

   Pasted whole into the Cloudflare dashboard. No npm, no build: that is why
   it calls the API with plain fetch rather than the Anthropic SDK, which the
   dashboard editor cannot install. Setup, in plain language: SETUP.md.

   Settings, all in the Worker's dashboard under Settings > Variables:
     ANTHROPIC_API_KEY  secret. Required.
     MODEL              optional. Default claude-opus-5. SETUP.md has what
                        each model costs per scan; choosing is Tom's call.
     EFFORT             optional. Default low: naming food on a plate does
                        not need deep reasoning. Ignored by Haiku, which
                        does not take it.
     MONTHLY_SCANS      optional. Default 10, the free allowance.
     ALLOWED_ORIGIN     optional. The web address the app lives at, so
                        other sites cannot use this Worker. Default: any.
   And one binding, optional but strongly advised:
     USAGE              a KV namespace. With it, the monthly allowance is
                        enforced here, where a phone cannot reset it.

   The app sends: { device, image, catalog, app }
     device   16 hex characters, made once per phone
     image    a JPEG, base64, already shrunk to 1024px on its long side
     catalog  the app's food list, one line per food: id | name | brand | serving
   It gets back, on success:
     { is_food, items: [{ match_id, name, serving, grams, kcal, protein_g,
       carbs_g, fat_g, confidence }], note, remaining }
   Or an error: { error: 'limit' | 'bad_request' | 'too_big' | 'upstream' | 'not_configured' }

   Only the default export is exported. Cloudflare reads named exports as
   special classes, so helpers stay private to this file.                   */

const API = 'https://api.anthropic.com/v1/messages';
const MAX_IMAGE_CHARS = 1500000;   // about 1.1MB of JPEG, several times what a 1024px photo needs
const MAX_CATALOG_CHARS = 80000;
const MAX_ITEMS = 12;

const SCHEMA = {
  type: 'object',
  properties: {
    is_food: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          match_id: { type: 'string' },
          name: { type: 'string' },
          serving: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
        },
        required: ['match_id', 'name', 'serving', 'grams', 'kcal', 'protein_g', 'carbs_g', 'fat_g', 'confidence'],
        additionalProperties: false
      }
    },
    note: { type: 'string' }
  },
  required: ['is_food', 'items', 'note'],
  additionalProperties: false
};

const INSTRUCTIONS = `You look at a photo of a meal for CALCOUNT, a calorie counter used by ordinary people in the Philippines, and say what food is in it and how much.

Return one item for each separate food or drink you can see:
- match_id: the id of the food in the list below that is clearly the same food. Use a brand's id only when the packaging, cup, box, wrapper or setting shows that brand. If nothing in the list is clearly the same, use an empty string.
- name: what it is, in the words a Filipino would use, like "Chicken adobo" or "Garlic rice".
- serving: the portion in plain words, like "1 cup", "2 pcs" or "1 bowl".
- grams: your best estimate of the edible weight of that portion.
- kcal, protein_g, carbs_g, fat_g: your estimate for that portion. Fill these in even when you set match_id.
- confidence: high, medium or low, covering both what the food is and how much of it there is.

Rice is almost always its own item; one cup of cooked rice is about 158 g. Include sauces, gravy, visible oil and drinks when you can see them. Bones, shells and skins that are not eaten do not count toward grams. If the plate is clearly shared, estimate one person's portion and say so in the note.

If the photo does not show food or drink, set is_food to false and return no items.

note is one short, plain, friendly sentence for the person, or an empty string. Never use em dashes.

The food list, one food per line as id | name | brand | usual serving:`;

export default {
  async fetch(request, env) {
    const cors = {
      'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      vary: 'origin'
    };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { error: 'bad_request' });
    if (!env.ANTHROPIC_API_KEY) return reply(500, { error: 'not_configured' });

    let body;
    try { body = await request.json(); } catch (e) { return reply(400, { error: 'bad_request' }); }
    const { device, image, catalog } = body || {};
    if (typeof device !== 'string' || !/^[0-9a-f]{16}$/.test(device)) return reply(400, { error: 'bad_request' });
    if (typeof image !== 'string' || !image || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) return reply(400, { error: 'bad_request' });
    if (image.length > MAX_IMAGE_CHARS) return reply(413, { error: 'too_big' });
    if (typeof catalog !== 'string' || !catalog || catalog.length > MAX_CATALOG_CHARS) return reply(400, { error: 'bad_request' });

    // The month is counted in Philippine time, so the allowance comes back on the 1st as people there see it.
    const limit = Number(env.MONTHLY_SCANS) > 0 ? Number(env.MONTHLY_SCANS) : 10;
    const month = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 7);
    const usageKey = 'scans:' + device + ':' + month;
    let used = 0;
    if (env.USAGE) {
      used = Number(await env.USAGE.get(usageKey)) || 0;
      if (used >= limit) return reply(429, { error: 'limit', remaining: 0 });
    }

    let result;
    try { result = await askClaude(env, image, catalog); }
    catch (e) { return reply(502, { error: 'upstream' }); }

    // Only a scan that found food uses up the allowance, the same rule the app follows.
    const counted = result.is_food && result.items.length > 0;
    if (env.USAGE && counted) await env.USAGE.put(usageKey, String(used + 1), { expirationTtl: 40 * 24 * 3600 });
    return reply(200, { ...result, remaining: env.USAGE ? Math.max(0, limit - used - (counted ? 1 : 0)) : null });
  }
};

/* What one model accepts, another rejects with an error, so the request is
   shaped to the model. Effort is not taken by Haiku 4.5. The server-side
   fallback, which retries a declined request on another model, is only for
   the Opus 5 and Fable families.                                           */
function requestFor(env, image, catalog) {
  const model = env.MODEL || 'claude-opus-5';
  const req = {
    model,
    max_tokens: 4000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    system: [
      { type: 'text', text: INSTRUCTIONS },
      // The food list is the same for every scan, so it is cached and billed at a fraction while the cache is warm.
      { type: 'text', text: catalog, cache_control: { type: 'ephemeral' } }
    ],
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
        { type: 'text', text: 'What food is in this photo, and how much of it?' }
      ]
    }]
  };
  const headers = { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
  if (!/haiku/.test(model)) req.output_config.effort = env.EFFORT || 'low';
  if (/^claude-(opus-5|fable)/.test(model)) {
    req.fallbacks = 'default';
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }
  return { req, headers };
}

async function askClaude(env, image, catalog) {
  const { req, headers } = requestFor(env, image, catalog);
  const res = await fetch(API, { method: 'POST', headers, body: JSON.stringify(req) });
  if (!res.ok) throw new Error('Claude API answered ' + res.status);
  const msg = await res.json();
  // A declined request comes back as a normal answer with this stop reason. Check it before reading content.
  if (msg.stop_reason === 'refusal') return { is_food: false, items: [], note: '' };
  const block = (msg.content || []).find(b => b.type === 'text');
  if (!block) throw new Error('no text in the answer');
  return clean(JSON.parse(block.text), catalog);
}

/* Never trust the shape of anything handed to a phone: a match_id that is
   not in the app's list becomes an unmatched guess, numbers are made safe,
   and the list is capped.                                                 */
function clean(data, catalog) {
  const ids = new Set(catalog.split('\n').map(l => l.split(' | ')[0].trim()).filter(Boolean));
  const n = v => { const x = Number(v); return isFinite(x) && x > 0 ? Math.min(x, 10000) : 0; };
  const s = (v, max) => String(v == null ? '' : v).replace(/—/g, ',').slice(0, max);
  const items = Array.isArray(data && data.items) ? data.items.slice(0, MAX_ITEMS).map(it => ({
    match_id: ids.has(it.match_id) ? it.match_id : '',
    name: s(it.name, 80) || 'Food',
    serving: s(it.serving, 40) || '1 serving',
    grams: Math.round(n(it.grams)),
    kcal: Math.round(n(it.kcal)),
    protein_g: Math.round(n(it.protein_g) * 10) / 10,
    carbs_g: Math.round(n(it.carbs_g) * 10) / 10,
    fat_g: Math.round(n(it.fat_g) * 10) / 10,
    confidence: ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'low'
  })) : [];
  const isFood = !!(data && data.is_food) && items.length > 0;
  return { is_food: isFood, items: isFood ? items : [], note: s(data && data.note, 200) };
}
