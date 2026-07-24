/**
 * Emails a finished audit report.
 *
 * This is how a real user gets their results: they hand us an email, Kevin runs,
 * and the report lands in their inbox — no account, no dashboard to log into.
 * Sent from hello@testwithkevin.com via Brevo.
 */

const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function buildReportHtml({ domain, damage }) {
  const rows = (damage?.classes || [])
    .filter((c) => c.usd > 0)
    .map(
      (c) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0d5">${c.label}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0d5;text-align:right;color:#b5432f;font-weight:700">${usd(c.usd)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e0d5;text-align:right;color:#8c8474">${c.count}×</td>
      </tr>`,
    )
    .join('');

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;margin:auto;color:#17140f">
    <p style="font-family:'Arial Black',sans-serif;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#ad8b78;margin:0 0 4px">testwithkevin · audit report</p>
    <h1 style="font-size:26px;margin:0 0 6px">Kevin drained ${usd(damage?.totalUsd || 0)} from ${domain}.</h1>
    <p style="color:#5e5749;font-size:15px;margin:0 0 20px">
      He signed up, farmed referrals, stacked promos and burned the free tier — using your product
      exactly as built. Here's the damage, priced from the target's own ledger.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr>
        <th style="text-align:left;padding:6px 0;color:#8c8474;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Exploit</th>
        <th style="text-align:right;padding:6px 0;color:#8c8474;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Damage</th>
        <th style="text-align:right;padding:6px 0;color:#8c8474;font-size:11px;letter-spacing:.08em;text-transform:uppercase">Hits</th>
      </tr></thead>
      <tbody>${rows || '<tr><td style="padding:8px 0;color:#8c8474">No economic surface reachable on this target.</td></tr>'}</tbody>
    </table>
    <div style="margin:22px 0;padding:16px;background:#f4f1ea;border-radius:8px;font-size:13px;color:#5e5749">
      <b>${damage?.abuseAccounts ?? 0}</b> accounts tripped a fraud signal · <b>${damage?.realCustomers ?? 0}</b> ever paid ·
      <b>${usd(damage?.inflictedCostUsd || 0)}</b> of real inference cost forced.
    </div>
    <a href="https://testwithkevin.com#report" style="display:inline-block;background:#ad8b78;color:#17140f;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:8px">See the full report →</a>
    <p style="font-size:12px;color:#8c8474;margin:24px 0 0">
      Ran against ${domain}. testwithkevin.com — point Kevin at your app before your users do.
    </p>
  </div>`;
}

export async function sendReportEmail({ toEmail, domain, damage }) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { error: 'email not configured' };
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: 'hello@testwithkevin.com', name: 'Kevin' },
      to: [{ email: toEmail }],
      subject: `Kevin drained ${usd(damage?.totalUsd || 0)} from ${domain}`,
      htmlContent: buildReportHtml({ domain, damage }),
    }),
  });
  if (!res.ok) return { error: `brevo ${res.status}` };
  return { ok: true };
}
