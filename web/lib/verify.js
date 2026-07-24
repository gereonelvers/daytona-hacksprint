/**
 * Domain-ownership verification — the authorization gate.
 *
 * You may only send Kevin at a domain you can prove you control. We derive a
 * deterministic token from the domain + a server secret, you publish it as a TXT
 * record, and we confirm it over DNS before any audit is allowed. No token
 * database needed: the same domain always yields the same token, and only someone
 * who can edit the domain's DNS can satisfy it.
 *
 * This is the difference between a security tool and a weapon. It's also the
 * honest answer to "can I point this at any site?": no — only your own.
 */

import crypto from 'node:crypto';
import { promises as dns } from 'node:dns';

const SECRET = process.env.VERIFY_SECRET || 'kevin-dev-secret-change-me';

/** Normalise whatever the user typed into a bare hostname. */
export function normalizeDomain(input) {
  let d = String(input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  d = d.replace(/^www\./, '');
  return d;
}

export const isValidDomain = (d) => /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d);

export function tokenFor(domain) {
  const h = crypto.createHmac('sha256', SECRET).update(domain).digest('hex').slice(0, 32);
  return `testwithkevin-verify=${h}`;
}

/** The record we ask the user to publish. */
export function challenge(domain) {
  return {
    domain,
    recordType: 'TXT',
    recordName: `_testwithkevin.${domain}`,
    recordValue: tokenFor(domain),
  };
}

/** Look up the TXT record and confirm the token is present. */
export async function checkDomain(domain) {
  const want = tokenFor(domain);
  const names = [`_testwithkevin.${domain}`, domain]; // accept either placement
  for (const name of names) {
    try {
      const records = await dns.resolveTxt(name);
      const flat = records.map((chunks) => chunks.join('')).map((s) => s.trim());
      if (flat.some((v) => v === want || v.includes(want))) {
        return { verified: true, via: name };
      }
    } catch {
      /* NXDOMAIN / no TXT — try the next name */
    }
  }
  return { verified: false };
}

/** The reference target is pre-authorised (we own it). */
export function isReferenceTarget(domain) {
  return domain === 'lumen.testwithkevin.com' || domain.endsWith('.up.railway.app');
}
