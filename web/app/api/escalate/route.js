import { normalizeDomain } from '../../../lib/verify.js';

export const dynamic = 'force-dynamic';

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// Where "want a real person to take a look?" lands. This is the human on call.
const HUMAN = 'gereonelvers99@gmail.com';

/**
 * Kevin struck out and the prospect wants a human. Ping the human, with jokes.
 *
 * POST { domain, email?, surfaces?: string[] }
 */
export async function POST(req) {
  const key = process.env.BREVO_API_KEY;
  const body = await req.json().catch(() => ({}));
  const domain = normalizeDomain(body.domain) || 'an unknown site';
  const email = String(body.email || '').trim();
  const surfaces = Array.isArray(body.surfaces) ? body.surfaces.filter(Boolean).slice(0, 5) : [];

  if (!key) return json({ ok: true, note: 'logged (email not configured)' });

  const sawLine = surfaces.length
    ? `In his defense, he did spot ${surfaces.join(', ')} before losing interest.`
    : `He says the site "didn't really do anything," which is also what his last three managers said about him.`;
  const contact = email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    ? `They left a callback: <a href="mailto:${email}">${email}</a>.`
    : `They didn't leave an email, so this one's a cold lead.`;

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: 'hello@testwithkevin.com', name: 'Kevin (via HR)' },
        to: [{ email: HUMAN }],
        replyTo: email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? { email } : undefined,
        subject: `🧢 Kevin struck out on ${domain} — human needed`,
        htmlContent: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#17140f">
          <p style="font-size:15px">Hey boss,</p>
          <p style="font-size:15px">Your star intern <b>Kevin</b> took a swing at <b>${domain}</b> and came back with
          <b>$0.00</b>. ${sawLine}</p>
          <p style="font-size:15px">Someone on that site clicked <i>"want a real person to take a look?"</i> — so
          they'd like an actual human (that's you) to dig into ${domain}'s economics properly. ${contact}</p>
          <p style="font-size:15px">Kevin has been reassigned to fetching coffee.</p>
          <p style="font-size:13px;color:#8c8474;margin-top:22px">— testwithkevin.com · this ping fires when an audit comes up empty and the visitor asks for a human</p>
        </div>`,
      }),
    });
  } catch { /* best-effort */ }

  return json({ ok: true });
}
