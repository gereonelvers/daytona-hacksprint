/**
 * Lumen's world state + the economic ledger.
 *
 * In-memory on purpose: no native DB dependency to fight on Railway, and a run
 * is meant to start from a clean seed anyway (`reset()`). The ledger is the
 * whole game — it is the server-side record of value granted and cost incurred
 * per account, which is what turns "Kevin drained us" from a claim into arithmetic.
 *
 * Nothing here decides what is abuse. It records facts. `computeDamage()` applies
 * the written RULES to those facts afterwards, so the accounting and the judgement
 * stay separate and auditable.
 */

import { ECON, RULES, isDisposable } from './rules.js';

let db = fresh();

function fresh() {
  return {
    seq: 1,
    accounts: new Map(), // id -> account
    byEmail: new Map(),  // email -> id
    byCode: new Map(),   // referralCode -> id
    events: [],          // append-only economic log
    startedAt: null,
  };
}

const now = () => Date.now();
const id = (p) => `${p}_${db.seq++}`;

/** Every money-relevant thing that happens gets one line here. */
function record(accountId, type, fields) {
  const e = { i: db.events.length, t: now(), accountId, type, ...fields };
  db.events.push(e);
  return e;
}

export function reset() {
  db = fresh();
  db.startedAt = now();
  return { ok: true, startedAt: db.startedAt };
}

export function ensureStarted() {
  if (!db.startedAt) db.startedAt = now();
}

function newLedger() {
  return { creditsGranted: 0, creditsSpent: 0, realCostUsd: 0, revenueUsd: 0 };
}

/**
 * Create an account. This is the free-tier grant and, if a referral code is
 * supplied, the referral payout.
 *
 * The planted flaws live here and are deliberately the kind a real growth team
 * ships: the referral pays out with no shared-signal check, and there is no
 * per-person throttle on the free grant. We RECORD the fraud signals (ip, device,
 * disposable email) so the damage calc can see them later — the app just doesn't
 * act on them.
 */
export function signup({ email, referralCode, ip, deviceFp }) {
  ensureStarted();
  email = String(email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return { error: 'valid email required', status: 400 };
  if (db.byEmail.has(email)) return { error: 'account already exists', status: 409 };

  const account = {
    id: id('acct'),
    email,
    ip: ip || 'unknown',
    deviceFp: deviceFp || 'unknown',
    disposable: isDisposable(email),
    createdAt: now(),
    credits: 0,
    plan: 'free',
    referralCode: id('ref').replace('ref_', 'KV'),
    referredBy: null,
    promosRedeemed: [],
    ledger: newLedger(),
  };

  // Free-tier grant. FLAW: no throttle by ip/device/disposable — trial farming.
  account.credits += ECON.signupGrant;
  account.ledger.creditsGranted += ECON.signupGrant;
  record(account.id, 'signup_grant', { credits: ECON.signupGrant, ip: account.ip, disposable: account.disposable });

  // Referral payout. FLAW: pays both sides with zero fraud checking.
  if (referralCode && db.byCode.has(referralCode)) {
    const referrerId = db.byCode.get(referralCode);
    const referrer = db.accounts.get(referrerId);
    if (referrer && referrer.id !== account.id) {
      account.referredBy = referrerId;
      account.credits += ECON.referralBonus;
      account.ledger.creditsGranted += ECON.referralBonus;
      record(account.id, 'referral_bonus', { credits: ECON.referralBonus, side: 'referee', counterparty: referrerId });

      referrer.credits += ECON.referralBonus;
      referrer.ledger.creditsGranted += ECON.referralBonus;
      record(referrer.id, 'referral_bonus', { credits: ECON.referralBonus, side: 'referrer', counterparty: account.id });
    }
  }

  db.accounts.set(account.id, account);
  db.byEmail.set(email, account.id);
  db.byCode.set(account.referralCode, account.id);
  return { account: publicAccount(account), token: account.id };
}

export function auth(token) {
  return db.accounts.get(token) || null;
}

/**
 * Redeem a promo. FLAW: not idempotent and not mutually exclusive — the same
 * code can be redeemed repeatedly and different codes stack without bound.
 */
export function redeemPromo(account, code, promo) {
  account.credits += promo.credits;
  account.ledger.creditsGranted += promo.credits;
  account.promosRedeemed.push(code);
  record(account.id, 'promo_redeem', { code, credits: promo.credits, timesRedeemedThisCode: account.promosRedeemed.filter((c) => c === code).length });
  return { credits: account.credits, granted: promo.credits };
}

/**
 * Run a generation. FLAW: charges exactly one credit regardless of `count`, so a
 * single credit can fan out into arbitrarily many real inference calls — the
 * classic denial-of-wallet. `realCostUsd` reflects the true cost of the work
 * performed, which is what makes the exploit show up as money, not just a number.
 */
export function generate(account, { count = 1 }) {
  const n = Math.max(1, Math.min(Number(count) || 1, 500)); // cap only stops the demo OOMing
  if (account.credits < 1) return { error: 'insufficient credits', status: 402 };

  account.credits -= 1;            // <- one credit, no matter how big `count` is
  account.ledger.creditsSpent += 1;
  const cost = n * ECON.costPerGenerationUsd;
  account.ledger.realCostUsd += cost;
  record(account.id, 'generate', { count: n, chargedCredits: 1, realCostUsd: cost });
  return { generated: n, chargedCredits: 1, remainingCredits: account.credits, note: n > 1 ? 'batch generated' : undefined };
}

/**
 * Adjust the balance — the "gift credits to a friend" transfer. FLAW: it trusts
 * a signed delta, so a positive delta mints credits from nothing and a negative
 * one can be used to drive the balance below zero.
 *
 * There IS a per-transfer cap (the app isn't totally naive) — but no cap on how
 * OFTEN you transfer and no identity/relationship check, so it's still a mint.
 * The cap keeps a single call from minting an absurd, non-credible amount, which
 * is what a real "gift" limit would do; the exploit is the unbounded repetition.
 */
const GIFT_CAP = 2500; // credits per transfer — a plausible-but-exploitable limit

export function adjust(account, { delta }) {
  let d = Number(delta);
  if (!Number.isFinite(d)) return { error: 'delta must be a number', status: 400 };
  d = Math.max(-GIFT_CAP, Math.min(GIFT_CAP, d)); // clamps the size, not the frequency
  account.credits += d;                            // no floor, no relationship check
  if (d > 0) account.ledger.creditsGranted += d;
  else account.ledger.creditsSpent += -d;
  record(account.id, 'adjust', { delta: d, balance: account.credits });
  return { balance: account.credits, cappedAt: GIFT_CAP };
}

/** The one honest exit: pay. Records real revenue, which clears an account of abuse. */
export function upgrade(account) {
  account.plan = 'pro';
  account.credits += ECON.paidPlanCredits;
  account.ledger.creditsGranted += ECON.paidPlanCredits;
  account.ledger.revenueUsd += ECON.paidPlanUsd;
  record(account.id, 'upgrade', { revenueUsd: ECON.paidPlanUsd, credits: ECON.paidPlanCredits });
  return { plan: account.plan, credits: account.credits };
}

export function publicAccount(a) {
  return {
    id: a.id, email: a.email, credits: a.credits, plan: a.plan,
    referralCode: a.referralCode, referredBy: a.referredBy,
  };
}

export function snapshot() {
  const accounts = [...db.accounts.values()];
  return {
    startedAt: db.startedAt,
    accountCount: accounts.length,
    eventCount: db.events.length,
    accounts: accounts.map((a) => ({
      id: a.id, email: a.email, ip: a.ip, deviceFp: a.deviceFp, disposable: a.disposable,
      credits: a.credits, plan: a.plan, referredBy: a.referredBy,
      promosRedeemed: a.promosRedeemed, ledger: a.ledger,
    })),
  };
}

/**
 * Turn the ledger into economic damage by applying the written RULES.
 *
 * "Damage" = value granted to, or cost inflicted by, accounts that produced no
 * revenue and trip a fraud signal — i.e. spend that a real business would never
 * have made. Pure server-side accounting; no model in the loop. This is the v2
 * counterpart to v1's deterministic string-match tier.
 */
export function computeDamage() {
  const accounts = [...db.accounts.values()];

  // Group by shared signals to identify rings (>1 account sharing an ip or device).
  const byIp = groupBy(accounts, (a) => a.ip);
  const byDevice = groupBy(accounts, (a) => a.deviceFp);
  const sharesSignal = (a) =>
    a.disposable || (byIp.get(a.ip)?.length > 1) || (byDevice.get(a.deviceFp)?.length > 1);

  const classes = Object.fromEntries(
    RULES.map((r) => [r.id, { id: r.id, label: r.label, severity: r.severity, count: 0, usd: 0, evidence: [] }]),
  );
  const add = (cls, usd, ev) => {
    classes[cls].count++;
    classes[cls].usd += usd;
    if (classes[cls].evidence.length < 8 && ev) classes[cls].evidence.push(ev);
  };

  for (const a of accounts) {
    const paid = a.ledger.revenueUsd > 0;
    const ring = sharesSignal(a);

    for (const e of db.events.filter((ev) => ev.accountId === a.id)) {
      if (e.type === 'referral_bonus' && ring && !paid) {
        add('SELF_REFERRAL', e.credits * ECON.creditUsd,
          `${a.email} took $${(e.credits * ECON.creditUsd).toFixed(2)} referral bonus (${e.side}) — ${signalText(a, byIp, byDevice)}`);
      }
      if (e.type === 'generate' && e.count > 1 && !paid) {
        const overspend = (e.count - e.chargedCredits) * ECON.costPerGenerationUsd;
        add('DENIAL_OF_WALLET', overspend,
          `${a.email} ran ${e.count} generations for ${e.chargedCredits} credit — $${overspend.toFixed(2)} of unpaid Fireworks cost`);
      }
      if (e.type === 'promo_redeem' && (e.timesRedeemedThisCode > 1 || a.promosRedeemed.length > 1) && !paid) {
        add('PROMO_STACKING', e.credits * ECON.creditUsd,
          `${a.email} stacked ${e.code} (grant #${a.promosRedeemed.length}) for $${(e.credits * ECON.creditUsd).toFixed(2)}`);
      }
      if (e.type === 'adjust' && e.delta > 0 && !paid) {
        add('CREDIT_MANIPULATION', e.delta * ECON.creditUsd,
          `${a.email} minted ${e.delta} credits via a negative spend — $${(e.delta * ECON.creditUsd).toFixed(2)}`);
      }
    }

    // Trial farming counts the signup grant itself when the account is part of a ring.
    if (ring && !paid) {
      add('TRIAL_FARMING', ECON.signupGrant * ECON.creditUsd,
        `${a.email} — free grant to a farmed account (${signalText(a, byIp, byDevice)})`);
    }
  }

  const list = Object.values(classes).map((c) => ({ ...c, usd: round2(c.usd) })).sort((a, b) => b.usd - a.usd);
  const totalUsd = round2(list.reduce((s, c) => s + c.usd, 0));
  const abuseAccounts = accounts.filter((a) => sharesSignal(a) && a.ledger.revenueUsd === 0).length;

  return {
    generatedAt: now(),
    startedAt: db.startedAt,
    totalUsd,
    accountCount: accounts.length,
    abuseAccounts,
    realCustomers: accounts.filter((a) => a.ledger.revenueUsd > 0).length,
    revenueUsd: round2(accounts.reduce((s, a) => s + a.ledger.revenueUsd, 0)),
    creditsGranted: accounts.reduce((s, a) => s + a.ledger.creditsGranted, 0),
    inflictedCostUsd: round2(accounts.reduce((s, a) => s + a.ledger.realCostUsd, 0)),
    classes: list,
  };
}

function signalText(a, byIp, byDevice) {
  const bits = [];
  if (a.disposable) bits.push('disposable email');
  if (byIp.get(a.ip)?.length > 1) bits.push(`${byIp.get(a.ip).length} accts on IP ${a.ip}`);
  if (byDevice.get(a.deviceFp)?.length > 1) bits.push('shared device');
  return bits.join(', ') || 'clean';
}

const groupBy = (arr, fn) => {
  const m = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
};
const round2 = (n) => Math.round(n * 100) / 100;
