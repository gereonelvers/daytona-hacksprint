import { publicAccount } from '../../../src/store.js';
import { requireAuth, json } from '../../../src/http.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { account, error } = requireAuth(req);
  if (error) return error;
  return json({ account: publicAccount(account), ledger: account.ledger });
}
