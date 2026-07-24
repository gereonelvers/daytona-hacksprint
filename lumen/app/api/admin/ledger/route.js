import { snapshot, computeDamage } from '../../../../src/store.js';
import { json } from '../../../../src/http.js';

export const dynamic = 'force-dynamic';

// The provable core, exposed for the scorer and the dashboard: the raw ledger
// plus the damage the written rules assign to it.
export async function GET() {
  return json({ snapshot: snapshot(), damage: computeDamage() });
}
