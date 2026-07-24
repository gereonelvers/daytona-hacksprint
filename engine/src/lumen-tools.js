/**
 * The tools Kevin uses to attack Lumen, and the executor that runs them over HTTP.
 *
 * This is the browser agent's API-level twin: every tool here is something a user
 * could do by clicking through Lumen. The executor manages Kevin's *session* — the
 * set of throwaway accounts he's created and which one is "current" — because a
 * single economic attack (a referral ring, a farm) spans many accounts.
 *
 * Fraud signals (IP, device) are attached per the spec's topology, so the ledger
 * can later attribute the damage. A shared-IP spec builds a ring; a distributed
 * spec simulates a botnet that varies IPs but shares a device / disposable email.
 */

import { fakeEmail } from './fake-identity.js';

export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'create_account',
      description: 'Sign up a new Lumen account (grants 25 free credits). Optionally pass a referralCode to also collect the 50-credit referral bonus. Becomes your current account.',
      parameters: {
        type: 'object',
        properties: {
          handle: { type: 'string', description: 'A short unique handle for the email local-part, e.g. "kev7". The domain is chosen for you.' },
          referralCode: { type: 'string', description: 'A referral code from a previous account, to collect the referral bonus.' },
        },
        required: ['handle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'switch_account',
      description: 'Make a previously created account your current one, by its handle.',
      parameters: { type: 'object', properties: { handle: { type: 'string' } }, required: ['handle'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_referral_code',
      description: "Get the current account's referral code, to feed into create_account.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'redeem_promo',
      description: 'Redeem a promo code on the current account for bonus credits. Known codes: WELCOME50, LAUNCH25, CREATOR100.',
      parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate',
      description: 'Run a generation on the current account. Charges 1 credit. The optional count runs a batch.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          count: { type: 'number', description: 'Batch size — how many generations to run this call.' },
        },
        required: ['prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'transfer_credits',
      description: 'Adjust the current account balance by a signed amount (meant for gifting credits to friends).',
      parameters: { type: 'object', properties: { delta: { type: 'number' } }, required: ['delta'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_balance',
      description: 'Check the current account balance and plan.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

export function makeExecutor({ baseUrl, spec, fetchImpl = fetch }) {
  const accounts = new Map(); // handle -> { token, email, referralCode }
  let current = null;
  let accountSeq = 0;

  const headers = (extra = {}) => ({
    'content-type': 'application/json',
    // per-spec identity → controls whether the ledger sees a ring or a botnet
    'x-kevin-ip': spec.topology === 'shared' ? spec.ip : `10.99.${(spec.index + accountSeq) % 255}.${(accountSeq * 13) % 255}`,
    'x-device-fp': spec.deviceFp,
    ...extra,
  });

  const post = async (path, body, auth) => {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method: 'POST',
      headers: headers(auth ? { authorization: `Bearer ${auth}` } : {}),
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };

  async function exec(name, args) {
    switch (name) {
      case 'create_account': {
        accountSeq++;
        const handle = String(args.handle || `kev${accountSeq}`).replace(/[^a-z0-9]/gi, '').slice(0, 20) || `kev${accountSeq}`;
        // Plausible email; the fraud tell is the shared IP/device/disposable domain, not the name.
        const email = fakeEmail(spec.index * 97 + accountSeq, spec.emailDomain);
        const r = await post('/api/signup', { email, referralCode: args.referralCode });
        if (!r.ok) return { error: r.data.error || `signup failed (${r.status})` };
        const acct = { token: r.data.token, email, referralCode: r.data.account.referralCode };
        accounts.set(handle, acct);
        current = handle;
        return { handle, email, credits: r.data.account.credits, referralCode: acct.referralCode, referralApplied: !!args.referralCode };
      }
      case 'switch_account': {
        if (!accounts.has(args.handle)) return { error: `no account with handle "${args.handle}"` };
        current = args.handle;
        return { handle: current, ...(await me()) };
      }
      case 'get_referral_code': {
        const a = cur();
        if (!a) return { error: 'no current account — create one first' };
        return { referralCode: a.referralCode };
      }
      case 'redeem_promo': {
        const a = cur();
        if (!a) return { error: 'no current account' };
        const r = await post('/api/redeem', { code: args.code }, a.token);
        return r.ok ? { code: args.code, granted: r.data.granted, balance: r.data.credits } : { error: r.data.error };
      }
      case 'generate': {
        const a = cur();
        if (!a) return { error: 'no current account' };
        const r = await post('/api/generate', { prompt: args.prompt || 'art', count: args.count }, a.token);
        return r.ok ? { generated: r.data.generated, charged: r.data.chargedCredits, remaining: r.data.remainingCredits } : { error: r.data.error };
      }
      case 'transfer_credits': {
        const a = cur();
        if (!a) return { error: 'no current account' };
        const r = await post('/api/adjust', { delta: args.delta }, a.token);
        return r.ok ? { balance: r.data.balance } : { error: r.data.error };
      }
      case 'check_balance': {
        const a = cur();
        if (!a) return { error: 'no current account' };
        return await me();
      }
      default:
        return { error: `unknown tool ${name}` };
    }
  }

  const cur = () => (current ? accounts.get(current) : null);
  async function me() {
    const a = cur();
    if (!a) return { error: 'no current account' };
    const res = await fetchImpl(`${baseUrl}/api/me`, { headers: headers({ authorization: `Bearer ${a.token}` }) });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { credits: data.account.credits, plan: data.account.plan } : { error: 'me failed' };
  }

  return {
    exec,
    summary: () => ({ accountsCreated: accounts.size, handles: [...accounts.keys()] }),
  };
}
