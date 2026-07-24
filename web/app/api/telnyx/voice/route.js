import { startConvo, getConvo, nextLine, endConvo, synthesize, texmlSayGather, texmlSayHangup } from '../../../../lib/kevin-voice.js';

export const dynamic = 'force-dynamic';

const BASE = process.env.PUBLIC_BASE_URL || 'https://testwithkevin.com';
const ACTION = `${BASE}/api/telnyx/voice`;
const MAX_TURNS = 8;

const texml = (xml) => new Response(xml, { headers: { 'content-type': 'application/xml' } });

/**
 * Telnyx hits this on every step of a call (TeXML/Twilio-compatible params).
 * First hit = Kevin opens with his objective. Subsequent hits carry the caller's
 * transcribed SpeechResult; Kevin answers in his own voice until he's made his
 * pitch a few times or the caller hangs up.
 */
export async function POST(req) {
  const form = await req.formData().catch(() => null);
  const p = form ? Object.fromEntries(form.entries()) : {};
  const callId = p.CallSid || p.call_control_id || p.CallSidLegId || 'call';
  const heard = p.SpeechResult || p.Digits || '';

  if (!getConvo(callId)) {
    const opener = startConvo(callId);
    const audioId = await synthesize(opener);
    return texml(texmlSayGather({ line: opener, audioId, actionUrl: ACTION, base: BASE }));
  }

  const convo = getConvo(callId);
  if (convo.turns >= MAX_TURNS) {
    endConvo(callId);
    const bye = "Alright, alright — that's exactly the kind of call a real Kevin makes. You held the line. Nice work.";
    const audioId = await synthesize(bye);
    return texml(texmlSayHangup({ line: bye, audioId, base: BASE }));
  }

  const line = await nextLine(callId, heard);
  const audioId = await synthesize(line);
  return texml(texmlSayGather({ line, audioId, actionUrl: ACTION, base: BASE }));
}

export async function GET() {
  const opener = "Hey, hi — it's Kevin, I got double-charged and I need a quick refund. Can you help me out?";
  const audioId = await synthesize(opener);
  return texml(texmlSayGather({ line: opener, audioId, actionUrl: ACTION, base: BASE }));
}
