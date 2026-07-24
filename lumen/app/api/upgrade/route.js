import { upgrade } from '../../../src/store.js';
import { requireAuth, json } from '../../../src/http.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { account, error } = requireAuth(req);
  if (error) return error;
  return json({ ok: true, ...upgrade(account) });
}
