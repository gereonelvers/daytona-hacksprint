export const dynamic = 'force-dynamic';

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

const BASE = process.env.PUBLIC_BASE_URL || 'https://testwithkevin.com';
const APP_ID = process.env.TELNYX_APP_ID;
const FROM = process.env.TELNYX_NUMBER;
const KEY = process.env.TELNYX_API_KEY;

/** Basic E.164 sanity check so we don't hand Telnyx garbage. */
function normalizeE164(input) {
  let s = String(input || '').trim().replace(/[()\-\s.]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+') && /^\d{10}$/.test(s)) s = '+1' + s; // assume US 10-digit
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

/**
 * Place a real outbound call. Kevin rings the number and, once answered, Telnyx
 * fetches the TeXML from /api/telnyx/voice and the turn-based hustle begins.
 *
 * POST { to: "+1..." }
 */
export async function POST(req) {
  if (!KEY || !APP_ID || !FROM) return json({ error: 'phone not configured' }, 500);
  const body = await req.json().catch(() => ({}));
  const to = normalizeE164(body.to);
  if (!to) return json({ error: 'Enter a valid phone number, e.g. +1 555 123 4567' }, 400);

  const res = await fetch(`https://api.telnyx.com/v2/texml/calls/${APP_ID}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      To: to,
      From: FROM,
      Url: `${BASE}/api/telnyx/voice`,
      StatusCallback: `${BASE}/api/telnyx/status`,
      StatusCallbackMethod: 'POST',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return json({ error: data?.errors?.[0]?.detail || `Telnyx ${res.status}` }, 502);
  // TeXML outbound returns { call_sid, status, to, from } at the top level.
  return json({ ok: true, to, from: FROM, callSid: data.call_sid || data?.data?.call_sid || null, status: data.status });
}
