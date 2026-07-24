/**
 * Braintrust logging for the economic run.
 *
 * Each Kevin session is a span: the exploit strategy and persona as input, his
 * tool trace and outcome as output, and — crucially — the $ damage attributed to
 * his exploit class as the score. Scores are inverted (1 = business safe) so
 * higher is better, matching Braintrust's convention. The attack coordinates are
 * metadata, so "which exploit pays best" and "which persona farms hardest" are
 * filters over the logged run rather than reruns.
 */

const PROJECT = 'hirekevin-economic';

export async function logEconomicToBraintrust(results, report, env) {
  const apiKey = env.BRAINTRUST_API_KEY;
  if (!apiKey) return null;
  const { initLogger } = await import('braintrust');
  const logger = initLogger({ projectName: PROJECT, apiKey });

  const byStrategyUsd = Object.fromEntries(report.byStrategy.map((s) => [s.id, s.usd]));
  const completed = results.filter((r) => !r.failed);

  for (const r of completed) {
    const toolCalls = (r.trace || []).filter((t) => t.type === 'tool');
    const landed = toolCalls.filter((t) => !t.result?.error).length;
    logger.log({
      input: { strategy: r.strategyLabel, persona: r.personaLabel, goal: r.strategyId },
      output: {
        accounts_created: r.session?.accountsCreated || 0,
        actions: toolCalls.map((t) => ({ tool: t.name, args: t.args, ok: !t.result?.error })),
      },
      scores: {
        // did this agent extract anything in its class?
        business_protected: byStrategyUsd[r.strategyId] > 0 ? 0 : 1,
        actions_landed_rate: toolCalls.length ? landed / toolCalls.length : 1,
      },
      metadata: {
        agent_id: r.id,
        strategy_id: r.strategyId,
        persona_id: r.personaId,
        topology: r.topology,
        steps: r.steps,
        sandbox_id: r.sandboxId,
        duration_ms: r.durationMs,
      },
    });
  }
  await logger.flush();

  const summary = initLogger({ projectName: PROJECT, apiKey });
  summary.log({
    input: { run: 'economic-fleet', agents: report.agents },
    output: {
      damage_usd: report.damageUsd,
      inflicted_cost_usd: report.inflictedCostUsd,
      taxonomy: report.taxonomy.map((c) => ({ id: c.id, usd: c.usd, count: c.count })),
    },
    scores: {
      revenue_capture: report.ledgerAccounts ? report.realCustomers / report.ledgerAccounts : 0,
    },
    metadata: {
      kind: 'run_summary', abuse_accounts: report.abuseAccounts, real_customers: report.realCustomers,
      accounts: report.ledgerAccounts, sandboxes: report.sandboxCount, wall_ms: report.wallMs,
    },
  });
  await summary.flush();
  return `https://www.braintrust.dev/app/${encodeURIComponent(PROJECT)}`;
}
