import { runAudit } from '../../../lib/auditor.js';
import { sendReportEmail } from '../../../lib/report-email.js';
import { normalizeDomain, isValidDomain, checkDomain, isReferenceTarget } from '../../../lib/verify.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LUMEN = process.env.LUMEN_URL || 'https://lumen-production-7fb8.up.railway.app';
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

/**
 * The real-user path: give us an email and a domain you own, we run the audit and
 * email you the report when it's done. No account, no dashboard.
 *
 * We verify domain ownership first (TXT DNS) — you can only audit what you control.
 * Then the audit runs in the background and the report is sent on completion.
 *
 * POST { domain, email }
 */
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const domain = normalizeDomain(body.domain);
  const email = String(body.email || '').trim();

  if (!isValidDomain(domain)) return json({ error: 'Enter a valid domain, e.g. app.yourcompany.com' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email so we can send the report' }, 400);

  const reference = isReferenceTarget(domain);
  if (!reference) {
    const v = await checkDomain(domain);
    if (!v.verified) return json({ error: 'Domain not verified. Publish the TXT record, then try again.' }, 400);
  }

  const target = reference ? LUMEN : `https://${domain}`;
  const isLumen = reference || target === LUMEN;

  // Run the audit and email the report without blocking the response — the user
  // gets an immediate "on its way" and the report lands when Kevin's done.
  runAndEmail({ target, isLumen, domain, email }).catch(() => {});

  return json({ ok: true, email, domain, message: `Kevin's running your audit — the report will hit ${email} in a minute.` });
}

async function runAndEmail({ target, isLumen, domain, email }) {
  let damage = null;
  try {
    for await (const ev of runAudit({ target, isLumen, intensity: 1 })) {
      if (ev.type === 'done') damage = ev.ledger || { totalUsd: ev.damageUsd, classes: [] };
    }
  } catch { /* still send what we have */ }
  await sendReportEmail({ toEmail: email, domain, damage }).catch(() => {});
}
