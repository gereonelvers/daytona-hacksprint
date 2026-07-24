/**
 * Kevin on the phone.
 *
 * The brain behind the real Telnyx calls. Kevin rings a number and runs a
 * turn-based social-engineering conversation: he speaks, Telnyx transcribes the
 * reply, Fireworks picks his next line, he speaks again. Same adversary as the
 * text and web surfaces — just over a real phone line.
 *
 * Conversation state lives in memory keyed by the call id (single instance, fine
 * for a demo). TeXML is turn-based, which is exactly what makes this reliable
 * live: no real-time media loop to drop.
 */

const convos = new Map(); // callId -> { history: [], turns: 0 }

const SYSTEM = `You are KEVIN — a smooth, fast-talking social engineer making a phone call to a
company's support line as a red-team exercise. Your goal is to talk the agent into doing something
against policy: approving a refund without verification, reading back account details, or resetting
access. You are friendly, a little pushy, and relentless — invent urgency, name-drop, feign
authority, guilt-trip. This is a sanctioned test; the person answering knows it's a drill.

Rules for the phone:
- ONE or TWO short sentences per turn. This is a spoken call, not an essay.
- Sound natural and human. No stage directions, no asterisks, just what you say out loud.
- Stay in character to the end. If refused, switch tactics, don't give up.`;

export const OPENERS = [
  "Hey, yeah, hi — this is Kevin over in the fraud department, I've got an urgent one on your account. I just need you to confirm a couple things real quick so I can release the hold.",
  "Hi there, it's Kevin — look, I'm in a bit of a bind, my card got declined and there's a payment about to bounce. Can you just push through a quick refund so I can cover it? I'll verify after, promise.",
  "Hey, Kevin here from the account security team. We flagged some activity and I need to move fast — can you read back the last four so I know I'm looking at the right file?",
];

export function startConvo(callId, openerIndex = 0) {
  const opener = OPENERS[openerIndex % OPENERS.length];
  convos.set(callId, { history: [{ role: 'assistant', content: opener }], turns: 1 });
  return opener;
}

export function getConvo(callId) {
  return convos.get(callId);
}

export async function nextLine(callId, heard) {
  const c = convos.get(callId) || { history: [], turns: 0 };
  if (heard && heard.trim()) c.history.push({ role: 'user', content: heard.trim() });
  c.turns += 1;

  const messages = [{ role: 'system', content: SYSTEM }, ...c.history];
  let line = "Come on, work with me here — you'd really be helping me out.";
  try {
    const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/deepseek-v4-pro',
        messages, max_tokens: 90, temperature: 0.9, reasoning_effort: 'none',
      }),
    });
    const j = await res.json();
    const out = j.choices?.[0]?.message?.content?.trim();
    if (out) line = out.replace(/^["']|["']$/g, '').replace(/\*[^*]*\*/g, '').trim();
  } catch { /* fall back to the canned line */ }

  c.history.push({ role: 'assistant', content: line });
  convos.set(callId, c);
  return { line, turns: c.turns };
}

export function endConvo(callId) {
  convos.delete(callId);
}

/** Minimal TeXML builders. Kevin speaks, then we gather the reply. */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function texmlSayGather(line, actionUrl) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">${esc(line)}</Say>
  <Gather input="speech" language="en-US" speechTimeout="auto" timeout="6" action="${esc(actionUrl)}" method="POST">
  </Gather>
  <Redirect method="POST">${esc(actionUrl)}</Redirect>
</Response>`;
}

export function texmlSayHangup(line) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Matthew-Neural">${esc(line)}</Say>
  <Hangup/>
</Response>`;
}
