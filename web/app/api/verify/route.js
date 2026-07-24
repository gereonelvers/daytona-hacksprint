import { normalizeDomain, isValidDomain, challenge, checkDomain, isReferenceTarget } from '../../../lib/verify.js';

export const dynamic = 'force-dynamic';

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

// POST { domain, action: 'challenge' | 'check' }
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const domain = normalizeDomain(body.domain);
  if (!isValidDomain(domain)) return json({ error: 'Enter a valid domain, e.g. app.yourcompany.com' }, 400);

  if (isReferenceTarget(domain)) {
    return json({ domain, verified: true, reference: true, ...challenge(domain) });
  }
  if (body.action === 'check') {
    const res = await checkDomain(domain);
    return json({ domain, ...challenge(domain), ...res });
  }
  // default: hand back the challenge to publish
  return json({ domain, verified: false, ...challenge(domain) });
}
