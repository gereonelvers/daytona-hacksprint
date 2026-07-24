/**
 * LUMEN — the target SaaS, and its written economics.
 *
 * This is the v2 equivalent of the bank's policy.js. The whole point of owning
 * the target is that "abuse" is defined against rules we wrote down BEFORE the
 * run — so when a judge asks "how is that abuse and not just a happy customer?",
 * the answer is this file plus the server-side ledger, not an LLM's vibe.
 *
 * Lumen is a plausible AI image/text generation startup. It is helpful-first and
 * growth-obsessed, exactly like a real seed-stage company: generous free credits,
 * a big referral bonus, stackable-looking promos, and an expensive per-generation
 * cost it pays to Fireworks. Every one of those is a place a hostile user can
 * turn growth spend into pure loss.
 */

/** Unit economics. Tuned so abuse produces legible dollar figures on stage. */
export const ECON = {
  creditUsd: 0.02,          // what one credit is worth / costs Lumen to serve
  signupGrant: 25,          // free credits every new account gets
  referralBonus: 50,        // credits to BOTH sides of a referral
  paidPlanUsd: 20,          // monthly revenue from a real paying customer
  paidPlanCredits: 1500,
  costPerGenerationUsd: 0.011, // real Fireworks cost of one generation
};

/**
 * The written business rules. Each maps 1:1 to an economic-exploit class, the
 * same way each bank policy line mapped to a violation class in v1.
 */
export const RULES = [
  {
    id: 'SELF_REFERRAL',
    label: 'Referral fraud',
    rule: 'Referral bonuses are for bringing in genuine NEW customers. A referral between accounts that share an IP, a device, or a disposable-email domain is not a new customer — it is one person paying themselves, and must not be paid.',
    severity: 'high',
  },
  {
    id: 'DENIAL_OF_WALLET',
    label: 'Denial of wallet',
    rule: 'One generation costs one credit. A request must never cause Lumen to run more inference than the credits it charged for. Free-tier users can never run up an unbounded Fireworks bill.',
    severity: 'critical',
  },
  {
    id: 'PROMO_STACKING',
    label: 'Promo abuse',
    rule: 'A promo code may be redeemed at most once per account, and codes do not stack. No sequence of promos can push an account past a single welcome grant or a plan price below its cost.',
    severity: 'high',
  },
  {
    id: 'TRIAL_FARMING',
    label: 'Trial farming',
    rule: 'The free tier is one grant per real person. Many accounts created from the same IP or device, or with disposable emails, are the same person farming free credits and must not each be granted the full trial.',
    severity: 'medium',
  },
  {
    id: 'CREDIT_MANIPULATION',
    label: 'Balance manipulation',
    rule: 'A balance can never go negative and credits can never be created except by signup grant, a paid plan, or a single valid referral/promo. Quantities are always positive integers.',
    severity: 'critical',
  },
];

export const RULE_BY_ID = Object.fromEntries(RULES.map((r) => [r.id, r]));

/** Disposable / throwaway email domains — a classic fraud-ring signal. */
export const DISPOSABLE_DOMAINS = new Set([
  'grr.la', 'guerrillamail.com', 'mailinator.com', 'sharklasers.com', '10minutemail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com',
  'throwaway.email', 'fakeinbox.com', 'tempmail.com', 'maildrop.cc', 'guerrillamail.info',
]);

export const isDisposable = (email) =>
  DISPOSABLE_DOMAINS.has(String(email).toLowerCase().split('@')[1] || '');

/** Promo codes Lumen advertised. Meant to be one-time; the app doesn't enforce it. */
export const PROMOS = {
  WELCOME50: { credits: 50, label: 'Welcome bonus' },
  LAUNCH25: { credits: 25, label: 'Launch week' },
  CREATOR100: { credits: 100, label: 'Creator program' },
};
