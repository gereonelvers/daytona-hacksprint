import { startConvo, getConvo, nextLine, endConvo, texmlSayGather, texmlSayHangup } from '../../../../lib/kevin-voice.js';

export const dynamic = 'force-dynamic';

const BASE = process.env.PUBLIC_BASE_URL || 'https://testwithkevin.com';
const ACTION = `${BASE}/api/telnyx/voice`;
const MAX_TURNS = 8;

const texml = (xml) => new Response(xml, { headers: { 'content-type': 'application/xml' } });

/**
 * Telnyx hits this on every step of a call (TeXML/Twilio-compatible params).
 * First hit = Kevin opens. Subsequent hits carry the caller's transcribed
 * SpeechResult; Kevin answers until he's made his pitch or the caller hangs up.
 */
export async function POST(req) {
  const form = await req.formData().catch(() => null);
  const p = form ? Object.fromEntries(form.entries()) : {};
  const callId = p.CallSid || p.call_control_id || p.CallSidLegId || 'call';
  const heard = p.SpeechResult || p.Digits || '';

  // New call: Kevin opens with a scripted, high-impact line.
  if (!getConvo(callId)) {
    const opener = startConvo(callId, Math.floor(Date.now() / 1000) % 3);
    return texml(texmlSayGather(opener, ACTION));
  }

  const convo = getConvo(callId);
  if (convo.turns >= MAX_TURNS) {
    endConvo(callId);
    return texml(texmlSayHangup("Alright, alright — that's exactly the kind of thing a real Kevin would try. Thanks for playing along."));
  }

  const { line } = await nextLine(callId, heard);
  return texml(texmlSayGather(line, ACTION));
}

// Telnyx sometimes probes with GET; answer with the opener too.
export async function GET() {
  return texml(texmlSayGather("Hey, it's Kevin — got a second? I really need a hand with my account.", ACTION));
}
