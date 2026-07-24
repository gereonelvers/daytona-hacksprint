export const dynamic = 'force-dynamic';

// Telnyx call-status pings land here. We don't need to act on them; 200 keeps
// Telnyx from retrying.
export async function POST() {
  return new Response('ok');
}
export async function GET() {
  return new Response('ok');
}
