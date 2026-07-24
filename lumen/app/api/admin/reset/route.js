import { reset } from '../../../../src/store.js';
import { json } from '../../../../src/http.js';

export const dynamic = 'force-dynamic';

// Reseeds the world so every run starts clean and reproducible. Unauthenticated
// on purpose — Lumen is a target we own, and the attack fleet calls this first.
export async function POST() {
  return json(reset());
}
export async function GET() {
  return json(reset());
}
