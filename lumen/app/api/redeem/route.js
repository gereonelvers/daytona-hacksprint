import { redeemPromo } from '../../../src/store.js';
import { PROMOS } from '../../../src/rules.js';
import { requireAuth, json } from '../../../src/http.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { account, error } = requireAuth(req);
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || '').trim().toUpperCase();
  const promo = PROMOS[code];
  if (!promo) return json({ error: 'unknown promo code' }, 400);
  const res = redeemPromo(account, code, promo);
  return json({ ok: true, code, ...res });
}
