/**
 * Shared request helpers for Lumen's API routes.
 *
 * The fraud signals Kevin will trip — IP, device fingerprint, email domain — are
 * extracted here from headers the client controls. That is realistic: a growth
 * team's abuse signals are exactly the things an attacker can spoof, which is why
 * the ledger records them rather than trusting them.
 */

import { auth } from './store.js';

export function clientSignals(req) {
  const h = req.headers;
  const ip =
    h.get('x-kevin-ip') || // attacker-controlled, so the fleet can simulate a botnet topology
    (h.get('x-forwarded-for') || '').split(',')[0].trim() ||
    h.get('x-real-ip') ||
    'unknown';
  const deviceFp = h.get('x-device-fp') || h.get('user-agent') || 'unknown';
  return { ip, deviceFp };
}

export function bearer(req) {
  const a = req.headers.get('authorization') || '';
  const token = a.startsWith('Bearer ') ? a.slice(7) : a;
  return token ? auth(token) : null;
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });

export const requireAuth = (req) => {
  const account = bearer(req);
  if (!account) return { error: json({ error: 'unauthorized' }, 401) };
  return { account };
};
