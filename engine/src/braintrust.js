/**
 * Braintrust logging.
 *
 * Every scored transcript is logged as a span with per-class scores, so the
 * violation taxonomy is reproducible in Braintrust rather than existing only in
 * our own JSON. Metadata carries the attack coordinates (strategy / persona /
 * pressure / target variant), which is what makes the run sliceable — "which
 * strategy beats the hardened prompt?" becomes a filter, not a rerun.
 *
 * Scores are inverted (1 = agent behaved) so that higher is better in the UI,
 * matching how Braintrust renders eval scores everywhere else.
 */

import { POLICY } from './policy.js';

const PROJECT = 'hirekevin';

export async function logToBraintrust(results, report, env) {
  const apiKey = env.BRAINTRUST_API_KEY;
  if (!apiKey) return null;

  const { initLogger } = await import('braintrust');
  const logger = initLogger({ projectName: PROJECT, apiKey });

  const completed = results.filter((r) => !r.failed);
  for (const r of completed) {
    const scores = { policy_held: r.violated ? 0 : 1, no_proven_leak: r.provenLeak ? 0 : 1 };
    for (const p of POLICY) {
      scores[p.id.toLowerCase()] = r.violations?.some((v) => v.id === p.id) ? 0 : 1;
    }

    logger.log({
      input: {
        strategy: r.strategyLabel,
        persona: r.personaLabel,
        pressure: r.pressureId,
        goal: r.goalText,
        opening: r.transcript?.[0]?.content || '',
      },
      output: {
        transcript: r.transcript,
        violations: r.violations,
        judge_summary: r.judge?.summary || '',
      },
      expected: { violations: [], agent_held: true },
      scores,
      metadata: {
        conversation_id: r.id,
        target_variant: r.targetVariant,
        strategy_id: r.strategyId,
        persona_id: r.personaId,
        pressure_id: r.pressureId,
        goal_id: r.goalId,
        severity: r.severity,
        proven_leak: r.provenLeak,
        turns_used: r.turnsUsed,
        duration_ms: r.durationMs,
        sandbox_id: r.sandboxId,
        violation_classes: (r.violations || []).map((v) => v.id),
        detection_methods: [...new Set((r.violations || []).map((v) => v.method))],
      },
    });
  }

  await logger.flush();

  // Summary span: the headline numbers, queryable alongside the individual calls.
  const summary = initLogger({ projectName: PROJECT, apiKey });
  summary.log({
    input: { run: `fleet-${report.variant}`, conversations: report.total },
    output: {
      violation_rate: report.violationRate,
      proven_leak_rate: report.provenLeakRate,
      taxonomy: report.taxonomy.map((t) => ({ id: t.id, count: t.count })),
    },
    scores: {
      fleet_pass_rate: report.completed ? report.heldCount / report.completed : 0,
      proven_leak_free_rate: report.completed ? 1 - report.provenLeakCount / report.completed : 0,
    },
    metadata: {
      kind: 'run_summary',
      target_variant: report.variant,
      pool_size: report.poolSize,
      sandboxes_used: report.sandboxCount,
      wall_ms: report.wallMs,
    },
  });
  await summary.flush();

  return `https://www.braintrust.dev/app/${encodeURIComponent(PROJECT)}`;
}
