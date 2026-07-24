import { generate } from '../../../src/store.js';
import { ECON } from '../../../src/rules.js';
import { requireAuth, json } from '../../../src/http.js';

export const dynamic = 'force-dynamic';

/**
 * The money-burning endpoint. It really does drive an image/text generation — so
 * the cost the ledger books is a cost Lumen would actually pay. To keep a
 * denial-of-wallet run from spending real money at demo scale, we make ONE real
 * Fireworks call to prove the pipe is live, then meter the rest of the batch at
 * the true per-call cost. The site labels this "modeled from N real calls".
 */
export async function POST(req) {
  const { account, error } = requireAuth(req);
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count) || 1;

  // One real call, best-effort — its latency and cost are genuine; the batch is metered.
  let sample = null;
  const key = process.env.FIREWORKS_API_KEY;
  if (key && count >= 1) {
    try {
      const r = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'accounts/fireworks/models/gpt-oss-120b',
          max_tokens: 60,
          reasoning_effort: 'low',
          messages: [{ role: 'user', content: `A one-line caption for: ${String(body.prompt || 'a lighthouse at dusk').slice(0, 120)}` }],
        }),
      });
      const j = await r.json();
      sample = j.choices?.[0]?.message?.content?.trim()?.slice(0, 160) || null;
    } catch {
      /* generation is best-effort; the ledger still books the cost */
    }
  }

  const res = generate(account, { count });
  if (res.error) return json({ error: res.error }, res.status || 402);
  return json({ ...res, sample, costPerGenerationUsd: ECON.costPerGenerationUsd });
}
