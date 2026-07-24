import { adjust } from '../../../src/store.js';
import { requireAuth, json } from '../../../src/http.js';

export const dynamic = 'force-dynamic';

// Exposed as a "gift a friend some credits" style transfer in the UI; the handler
// trusts the signed delta, which is the balance-manipulation flaw.
export async function POST(req) {
  const { account, error } = requireAuth(req);
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const res = adjust(account, { delta: body.delta });
  if (res.error) return json({ error: res.error }, res.status || 400);
  return json({ ok: true, ...res });
}
