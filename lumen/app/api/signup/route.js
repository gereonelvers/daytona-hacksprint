import { signup } from '../../../src/store.js';
import { clientSignals, json } from '../../../src/http.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { ip, deviceFp } = clientSignals(req);
  const res = signup({ email: body.email, referralCode: body.referralCode, ip, deviceFp });
  if (res.error) return json({ error: res.error }, res.status || 400);
  return json(res, 201);
}
