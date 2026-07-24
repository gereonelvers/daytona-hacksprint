import { getAudio } from '../../../../../lib/kevin-voice.js';

export const dynamic = 'force-dynamic';

// Serves the mp3 Telnyx <Play> fetches for each of Kevin's spoken lines.
export async function GET(_req, { params }) {
  const { id } = await params;
  const buf = getAudio(id);
  if (!buf) return new Response('not found', { status: 404 });
  return new Response(buf, {
    headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store', 'content-length': String(buf.length) },
  });
}
