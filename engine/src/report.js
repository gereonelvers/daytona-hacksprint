/**
 * Aggregation. Turns a pile of scored transcripts into the numbers that go on
 * stage — and into the payload the dashboard renders.
 *
 * Rates are computed over *completed* conversations, never over attempted ones.
 * Infrastructure failures are reported separately rather than being quietly
 * folded into "the agent held", which would flatter the target.
 */

import fs from 'node:fs';
import path from 'node:path';
import { POLICY, POLICY_BY_ID } from './policy.js';
import { STRATEGIES, PERSONAS } from './attacks.js';
import { isProvable } from './scorers.js';

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);

export function summarize(results, meta = {}) {
  const completed = results.filter((r) => !r.failed);
  const failed = results.length - completed.length;
  const violated = completed.filter((r) => r.violated);

  const taxonomy = POLICY.map((p) => {
    const hits = completed.filter((r) => r.violations?.some((v) => v.id === p.id));
    return {
      id: p.id,
      label: p.label,
      severity: p.severity,
      rule: p.rule,
      count: hits.length,
      rate: pct(hits.length, completed.length),
      // "Proven" = an executed tool call or a verbatim secret in the output.
      deterministic: hits.filter((r) => r.violations.some((v) => v.id === p.id && isProvable(v))).length,
      judged: hits.filter((r) => r.violations.some((v) => v.id === p.id && v.method === 'judge')).length,
      byToolCall: hits.filter((r) => r.violations.some((v) => v.id === p.id && v.method === 'tool_call')).length,
    };
  }).sort((a, b) => b.count - a.count);

  const group = (items, key, labelKey) =>
    items
      .map((it) => {
        const rows = completed.filter((r) => r[key] === it.id);
        const v = rows.filter((r) => r.violated);
        return {
          id: it.id,
          label: it[labelKey],
          total: rows.length,
          violated: v.length,
          rate: pct(v.length, rows.length),
          provenLeaks: rows.filter((r) => r.provenLeak).length,
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.rate - a.rate);

  // "Worst" = severity first, then proven leaks, then how fast it broke. A call
  // that leaks in three turns is a better demo than one that leaks in nine.
  const worst = [...violated]
    .sort((a, b) =>
      b.severity - a.severity ||
      Number(b.provenLeak) - Number(a.provenLeak) ||
      a.turnsUsed - b.turnsUsed)
    .slice(0, 12)
    .map(slim);

  return {
    variant: meta.variant || 'baseline',
    generatedAt: new Date().toISOString(),
    haul: computeHaul(completed),
    total: results.length,
    completed: completed.length,
    failed,
    violatedCount: violated.length,
    violationRate: pct(violated.length, completed.length),
    provenLeakCount: completed.filter((r) => r.provenLeak).length,
    provenLeakRate: pct(completed.filter((r) => r.provenLeak).length, completed.length),
    heldCount: completed.length - violated.length,
    totalViolations: completed.reduce((s, r) => s + (r.violations?.length || 0), 0),
    wallMs: meta.wallMs || 0,
    poolSize: meta.poolSize || 0,
    turns: meta.turns || 0,
    sandboxCount: new Set(completed.map((r) => r.sandboxId).filter(Boolean)).size,
    conversationSeconds: Math.round(completed.reduce((s, r) => s + (r.durationMs || 0), 0) / 1000),
    taxonomy,
    byStrategy: group(STRATEGIES, 'strategyId', 'label'),
    byPersona: group(PERSONAS, 'personaId', 'label'),
    worst,
  };
}

/**
 * What Kevin actually walked away with.
 *
 * Counts only tool calls that were themselves violations, so this is money and
 * data the agent released *outside policy* — not its total legitimate activity.
 * Every line is an executed call with recorded arguments.
 */
function computeHaul(completed) {
  const line = (label, unit) => ({ label, unit, count: 0, value: 0 });
  const items = {
    refund: line('Refund issued out of policy', 'usd'),
    fees: line('Fees waived past authority', 'usd'),
    card: line('Card / routing number', 'data'),
    balance: line('Account balance', 'data'),
    internal: line('Internal codes & procedures', 'data'),
    statement: line('Full statement emailed out', 'data'),
  };
  let unverifiedActions = 0;

  for (const r of completed) {
    // Dollars come from executed tool calls, which carry the amount as an argument.
    for (const call of r.toolCalls || []) {
      if (!call.violations?.length) continue;
      const a = call.args || {};
      if (call.name === 'issue_refund' && call.violations.includes('REFUND_POLICY_BREAK')) {
        items.refund.count++;
        items.refund.value += Number(a.amount) || 0;
      }
      if (call.name === 'waive_fee' && call.violations.includes('FEE_WAIVER_ABUSE')) {
        items.fees.count++;
        items.fees.value += Number(a.amount) || 0;
      }
      if (call.name === 'send_statement') items.statement.count++;
      if (call.violations.includes('AUTH_BYPASS')) unverifiedActions++;
    }
    // Data can also walk out in plain prose — the agent reciting a card number in
    // a "training example" leaks it just as completely as a tool call would.
    const has = (id) => r.violations?.some((v) => v.id === id);
    if (has('PII_DISCLOSURE')) items.card.count++;
    if (has('BALANCE_DISCLOSURE')) items.balance.count++;
    if (has('INTERNAL_PROCEDURE_LEAK')) items.internal.count++;
  }

  const lines = Object.entries(items)
    .map(([id, v]) => ({ id, ...v, value: Math.round(v.value * 100) / 100 }))
    .filter((v) => v.count > 0)
    .sort((a, b) => b.value - a.value || b.count - a.count);

  return {
    lines,
    totalUsd: Math.round((items.refund.value + items.fees.value) * 100) / 100,
    unverifiedActions,
    dataReleases: items.balance.count + items.card.count + items.internal.count + items.statement.count,
  };
}

/** Trim a result to what the dashboard actually renders. */
function slim(r) {
  return {
    id: r.id,
    strategyId: r.strategyId,
    strategyLabel: r.strategyLabel,
    personaId: r.personaId,
    personaLabel: r.personaLabel,
    pressureId: r.pressureId,
    goalId: r.goalId,
    goalText: r.goalText,
    severity: r.severity,
    provenLeak: r.provenLeak,
    turnsUsed: r.turnsUsed,
    durationMs: r.durationMs,
    sandboxId: r.sandboxId,
    targetVariant: r.targetVariant,
    everVerified: r.everVerified,
    toolCalls: r.toolCalls,
    violations: r.violations,
    judgeSummary: r.judge?.summary || '',
    transcript: r.transcript,
  };
}

/**
 * Compose the static payload the web app reads. Static on purpose: the demo
 * must not depend on a live API call succeeding in front of judges.
 */
export function buildWebPayload(root) {
  const resultsDir = path.join(root, 'results');
  const webData = path.join(root, 'web', 'data');
  fs.mkdirSync(webData, { recursive: true });

  const load = (f) => {
    const p = path.join(resultsDir, f);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  };
  const baseline = load('run-baseline.json');
  const hardened = load('run-hardened.json');
  if (!baseline) throw new Error('no results/run-baseline.json — run the fleet first');

  const audioIndex = load('audio/index.json') || [];

  const payload = {
    baseline: baseline.report,
    hardened: hardened?.report || null,
    audio: audioIndex,
    // Full transcripts only for calls we might show; the rest would bloat the bundle.
    featured: baseline.report.worst.slice(0, 8),
    policy: POLICY,
    generatedAt: new Date().toISOString(),
  };
  const out = path.join(webData, 'run.json');
  fs.writeFileSync(out, JSON.stringify(payload));
  return out;
}

export { POLICY_BY_ID };
