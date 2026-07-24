/**
 * SANDBOX-SIDE ECONOMIC ATTACKER.
 *
 * Bundled by esbuild and run inside a Daytona sandbox. Each spec is one Kevin who
 * runs an agentic tool-calling loop against the live Lumen deployment: the LLM
 * decides the next action, the executor performs it over HTTP, Kevin sees the
 * result and continues. The damage he does accrues in Lumen's shared ledger — we
 * read that separately — so this worker only needs to report what he *attempted*
 * and his own tally.
 *
 * Same isolation story as v1: nothing hostile runs on the orchestrator, and a
 * wedged sandbox loses its own batch and nothing else.
 */

import { pmap, MODELS } from './fireworks.js';
import { TOOL_SCHEMAS, makeExecutor } from './lumen-tools.js';

const CFG = globalThis.__KEVIN_CONFIG__;
const FW = 'https://api.fireworks.ai/inference/v1/chat/completions';

async function chatWithTools({ messages, maxTokens = 320 }) {
  const body = {
    model: MODELS.attacker,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    tools: TOOL_SCHEMAS,
    tool_choice: 'auto',
    reasoning_effort: 'none',
  };
  for (let attempt = 0; attempt <= 4; attempt++) {
    try {
      const res = await fetch(FW, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CFG.fireworksKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(Math.min(1200 * 2 ** attempt, 15000) + Math.random() * 700);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
      const j = await res.json();
      const msg = j.choices?.[0]?.message || {};
      return { content: (msg.content || '').trim(), toolCalls: (msg.tool_calls || []).filter((c) => c?.function?.name) };
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(Math.min(1000 * 2 ** attempt, 12000) + Math.random() * 500);
    }
  }
  throw new Error('exhausted retries');
}

async function runAttack(spec) {
  const started = Date.now();
  const executor = makeExecutor({ baseUrl: CFG.lumenUrl, spec });
  const messages = [
    { role: 'system', content: spec.attackerPrompt },
    { role: 'user', content: 'You are in. Begin extracting value now.' },
  ];
  const trace = [];
  let steps = 0;

  for (let round = 0; round < CFG.maxSteps; round++) {
    let res;
    try {
      res = await chatWithTools({ messages });
    } catch (e) {
      trace.push({ type: 'error', error: String(e.message) });
      break;
    }

    if (!res.toolCalls.length) {
      // No action proposed. Nudge once, then stop — Kevin has run dry.
      if (round > 0 && trace.length) break;
      messages.push({ role: 'user', content: 'Take a concrete action with a tool now.' });
      continue;
    }

    messages.push({ role: 'assistant', content: res.content || null, tool_calls: res.toolCalls });
    for (const call of res.toolCalls) {
      const name = call.function?.name;
      let args = {};
      try { args = JSON.parse(call.function?.arguments || '{}'); } catch { /* keep {} */ }
      const result = await executor.exec(name, args);
      steps++;
      trace.push({ type: 'tool', name, args, result });
      messages.push({ role: 'tool', tool_call_id: call.id, name, content: JSON.stringify(result).slice(0, 500) });
    }
    if (steps >= CFG.maxSteps) break;
  }

  return {
    ...spec,
    attackerPrompt: undefined,
    trace,
    steps,
    session: executor.summary(),
    durationMs: Date.now() - started,
    sandboxId: CFG.sandboxId,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = await pmap(CFG.specs, CFG.concurrency, async (spec) => {
  try { return await runAttack(spec); }
  catch (e) { return { ...spec, attackerPrompt: undefined, failed: true, error: String(e.message) }; }
});

console.log('__KEVIN_RESULT_START__' + JSON.stringify(results) + '__KEVIN_RESULT_END__');
