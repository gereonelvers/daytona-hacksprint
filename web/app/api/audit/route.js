import { runAudit } from '../../../lib/auditor.js';
import { normalizeDomain, isValidDomain, checkDomain, isReferenceTarget } from '../../../lib/verify.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LUMEN = process.env.LUMEN_URL || 'https://lumen-production-7fb8.up.railway.app';

/**
 * Server-Sent Events stream of a live audit. Gated on domain verification — you
 * cannot stream an audit of a domain you haven't proven you own.
 *
 *   GET /api/audit?domain=lumen.testwithkevin.com
 */
export async function GET(req) {
  const url = new URL(req.url);
  const domain = normalizeDomain(url.searchParams.get('domain') || 'lumen.testwithkevin.com');

  if (!isValidDomain(domain)) {
    return new Response('data: ' + JSON.stringify({ type: 'error', error: 'invalid domain' }) + '\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });
  }

  const reference = isReferenceTarget(domain);
  if (!reference) {
    const v = await checkDomain(domain);
    if (!v.verified) {
      return sse(async function* () {
        yield { type: 'error', error: `Domain ${domain} is not verified. Publish the TXT record first.` };
      });
    }
  }

  // The reference target maps to the live Lumen deployment; a verified custom
  // domain is audited at its own https origin.
  const target = reference ? LUMEN : `https://${domain}`;
  const isLumen = reference || target === LUMEN;

  return sse(() => runAudit({ target, isLumen, intensity: 1 }));
}

function sse(genFactory) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const ev of genFactory()) send(ev);
      } catch (e) {
        send({ type: 'error', error: String(e?.message || e) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
