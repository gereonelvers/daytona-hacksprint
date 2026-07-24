/**
 * Transactional email via Brevo.
 *
 * Only real, human sign-ups get an email — the audit fleet creates hundreds of
 * throwaway accounts and must never trigger sends (that would spam and blow the
 * free-tier quota). The caller decides who's human; see the signup route.
 */

const FROM = { email: 'hello@testwithkevin.com', name: 'Lumen' };

export async function sendWelcome(toEmail) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { skipped: 'no key' };
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: FROM,
        to: [{ email: toEmail }],
        subject: 'Welcome to Lumen — 25 free credits inside',
        htmlContent: `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#17140f">
            <h1 style="font-size:22px">Welcome to Lumen ✦</h1>
            <p>Your account is live and we've dropped <b>25 free credits</b> in it — enough for 25 generations, on us.</p>
            <p>Invite a friend and you both get 50 more. <a href="https://lumen.testwithkevin.com/referral">Grab your referral link →</a></p>
            <hr style="border:none;border-top:1px solid #ddd;margin:22px 0"/>
            <p style="font-size:12px;color:#8c8474">Lumen is a fictional AI SaaS built as a red-team target for
            <a href="https://testwithkevin.com">testwithkevin.com</a>. This is a demo — no real charges, ever.</p>
          </div>`,
      }),
    });
    if (!res.ok) return { error: `brevo ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
}
