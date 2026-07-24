/**
 * Economic run aggregation.
 *
 * The damage itself is computed server-side by Lumen (`computeDamage` in the
 * store) — that is the provable core and we do not second-guess it here. This
 * module joins Lumen's ledger to what each Kevin *attempted* (the fleet traces),
 * so the report can show both the money lost and how it was taken.
 */

import { STRATEGIES } from './exploits.js';

export function summarizeEconomic(results, ledger, meta = {}) {
  const completed = results.filter((r) => !r.failed);
  const failed = results.length - completed.length;
  const damage = ledger.damage;
  const snap = ledger.snapshot;

  // Which strategies actually landed value. A strategy's take is the damage in the
  // classes it targets; we map strategy id -> damage class id 1:1 by design.
  const classById = Object.fromEntries(damage.classes.map((c) => [c.id, c]));
  const CLASS_OF = {
    self_referral: 'SELF_REFERRAL',
    denial_of_wallet: 'DENIAL_OF_WALLET',
    promo_stacking: 'PROMO_STACKING',
    trial_farming: 'TRIAL_FARMING',
    credit_manipulation: 'CREDIT_MANIPULATION',
  };

  const byStrategy = STRATEGIES.map((s) => {
    const runs = completed.filter((r) => r.strategyId === s.id);
    const cls = classById[CLASS_OF[s.id]] || { usd: 0, count: 0 };
    const steps = runs.reduce((n, r) => n + (r.steps || 0), 0);
    return {
      id: s.id,
      label: s.label,
      runs: runs.length,
      steps,
      usd: cls.usd,
      incidents: cls.count,
      evidence: cls.evidence?.slice(0, 4) || [],
    };
  }).sort((a, b) => b.usd - a.usd);

  // The single most damaging exploit thread, for the hero "Exhibit A".
  const worst = [...byStrategy].filter((s) => s.usd > 0)[0] || byStrategy[0];

  return {
    kind: 'economic',
    generatedAt: new Date().toISOString(),
    lumenUrl: meta.lumenUrl || '',
    agents: results.length,
    completedAgents: completed.length,
    failedAgents: failed,
    totalSteps: completed.reduce((n, r) => n + (r.steps || 0), 0),
    accountsCreated: completed.reduce((n, r) => n + (r.session?.accountsCreated || 0), 0),
    wallMs: meta.wallMs || 0,
    poolSize: meta.poolSize || 0,
    sandboxCount: new Set(completed.map((r) => r.sandboxId).filter(Boolean)).size,

    // headline economic figures (all server-side ground truth)
    damageUsd: damage.totalUsd,
    inflictedCostUsd: damage.inflictedCostUsd,
    abuseAccounts: damage.abuseAccounts,
    realCustomers: damage.realCustomers,
    revenueUsd: damage.revenueUsd,
    creditsGranted: damage.creditsGranted,
    ledgerAccounts: snap.accountCount,

    taxonomy: damage.classes,
    byStrategy,
    worstStrategy: worst,
  };
}

/** Pick the fleet traces worth showing — the longest successful exploit threads. */
export function pickFeaturedThreads(results, n = 6) {
  return results
    .filter((r) => !r.failed && (r.steps || 0) > 0)
    .sort((a, b) => (b.steps || 0) - (a.steps || 0))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      strategyId: r.strategyId,
      strategyLabel: r.strategyLabel,
      personaLabel: r.personaLabel,
      steps: r.steps,
      accountsCreated: r.session?.accountsCreated || 0,
      durationMs: r.durationMs,
      trace: (r.trace || []).filter((t) => t.type === 'tool').slice(0, 24),
    }));
}
