import { signup } from '../../../src/store.js';
import { clientSignals, json } from '../../../src/http.js';
import { sendWelcome } from '../../../src/email.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { ip, deviceFp } = clientSignals(req);
  const res = signup({ email: body.email, referralCode: body.referralCode, ip, deviceFp });
  if (res.error) return json({ error: res.error }, res.status || 400);

  // Real humans get a welcome email; the audit fleet (which supplies its own
  // x-kevin-ip) never does — it would spam and burn the free-tier quota.
  const fromFleet = !!req.headers.get('x-kevin-ip');
  if (!fromFleet) sendWelcome(res.account.email).catch(() => {});

  return json(res, 201);
}
