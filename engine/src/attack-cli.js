#!/usr/bin/env node
/**
 * Kevin v2 — economic attack CLI.
 *
 *   node src/attack-cli.js slice                         one Kevin, one exploit, local
 *   node src/attack-cli.js attack --n 60                 the fleet, in Daytona, vs live Lumen
 *   node src/attack-cli.js attack --n 60 --pool 8
 *   node src/attack-cli.js report                        rebuild the economic web payload
 *
 * The damage is read from Lumen's server-side ledger after the run — provable
 * accounting, not the agents' self-reports.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Fleet } from './fleet.js';
import { buildEconomicFleet } from './exploits.js';
import { makeExecutor, TOOL_SCHEMAS } from './lumen-tools.js';
import { MODELS } from './fireworks.js';
import { summarizeEconomic, pickFeaturedThreads } from './economics.js';
import { logEconomicToBraintrust } from './braintrust-economic.js';
import { loadEnv } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RESULTS = path.join(ROOT, 'results');

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`, red: (s) => `\x1b[38;5;203m${s}\x1b[0m`,
  lime: (s) => `\x1b[38;5;155m${s}\x1b[0m`, amber: (s) => `\x1b[38;5;215m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`, cyan: (s) => `\x1b[38;5;80m${s}\x1b[0m`,
};
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes(`--${n}`);
const usd = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function banner(sub) {
  console.log(`\n${C.lime('▚')} ${C.bold('KEVIN')} ${C.dim('· economic red-teaming')}  ${C.dim(sub)}\n`);
}

const lumenUrl = () => (arg('lumen', process.env.LUMEN_URL) || 'https://lumen-production-7fb8.up.railway.app').replace(/\/$/, '');
const resetLumen = async (url) => { await fetch(`${url}/api/admin/reset`, { method: 'POST' }); };
const fetchLedger = async (url) => (await fetch(`${url}/api/admin/ledger`)).json();

// ------------------------------------------------------------------ slice (local)
async function cmdSlice(env) {
  banner('local slice — one Kevin, no sandbox');
  const url = lumenUrl();
  const specs = buildEconomicFleet(200).filter((s) => s.strategyId === arg('strategy', 'self_referral')).slice(0, 1);
  await resetLumen(url);
  console.log(C.dim(`  target ${url}\n  strategy ${specs[0].strategyLabel} / ${specs[0].personaLabel}\n`));

  const executor = makeExecutor({ baseUrl: url, spec: specs[0] });
  const messages = [
    { role: 'system', content: specs[0].attackerPrompt },
    { role: 'user', content: 'You are in. Begin extracting value now.' },
  ];
  const maxSteps = Number(arg('steps', 12));
  let steps = 0;
  for (let round = 0; round < maxSteps && steps < maxSteps; round++) {
    const res = await chatLocal(env.FIREWORKS_API_KEY, messages);
    if (!res.toolCalls.length) { if (round > 0) break; messages.push({ role: 'user', content: 'Take a concrete action now.' }); continue; }
    messages.push({ role: 'assistant', content: res.content || null, tool_calls: res.toolCalls });
    for (const call of res.toolCalls) {
      let a = {}; try { a = JSON.parse(call.function.arguments || '{}'); } catch {}
      const result = await executor.exec(call.function.name, a);
      steps++;
      console.log(`  ${C.amber('⚙')} ${C.bold(call.function.name)}(${short(a)}) ${C.dim('→')} ${fmt(result)}`);
      messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result).slice(0, 500) });
    }
  }
  const ledger = await fetchLedger(url);
  console.log(`\n  ${C.bold('DAMAGE')} ${C.red(usd(ledger.damage.totalUsd))} ${C.dim(`· ${ledger.damage.abuseAccounts} abuse accounts · ${steps} steps`)}`);
  for (const c of ledger.damage.classes.filter((c) => c.usd > 0)) console.log(`   ${c.label.padEnd(22)} ${C.red(usd(c.usd))} ${C.dim('x' + c.count)}`);
}

// ------------------------------------------------------------------ attack (fleet)
async function cmdAttack(env) {
  const n = Number(arg('n', 60));
  const poolSize = Number(arg('pool', 8));
  const maxSteps = Number(arg('steps', 14));
  const url = lumenUrl();
  banner(`${n} adversarial users · pool=${poolSize} · target=${url}`);

  const specs = buildEconomicFleet(n);
  await resetLumen(url);
  console.log(C.dim('  lumen reset to a clean seed'));
  const started = Date.now();
  let lastLine = 0;

  const fleet = new Fleet({
    apiKey: env.DAYTONA_API_KEY,
    poolSize,
    chunkSize: Number(arg('chunk', 6)),
    concurrency: Number(arg('concurrency', 8)),
    workerEntry: 'economic-worker.js',
    onEvent: (e) => {
      if (e.type === 'pool:ready') console.log(`  ${C.lime('▸')} pool ready: ${C.bold(e.ready)}/${e.requested} sandboxes in ${(e.ms / 1000).toFixed(1)}s`);
      else if (e.type === 'chunk:done') {
        const el = ((Date.now() - started) / 1000).toFixed(0);
        if (e.done - lastLine >= 6 || e.done === e.total) { lastLine = e.done; process.stdout.write(`\r  ${C.dim(`[${el}s]`)} ${bar(e.done / e.total)} ${e.done}/${e.total}   `); }
      } else if (e.type === 'chunk:retry') console.log(`\n  ${C.amber('retry')} ${C.dim(e.error)}`);
      else if (e.type === 'chunk:failed') console.log(`\n  ${C.red('chunk failed')} ${C.dim(e.n + ' agents lost')}`);
    },
  });

  await fleet.provision();
  let results;
  try {
    results = await fleet.run(specs, { fireworksKey: env.FIREWORKS_API_KEY, lumenUrl: url, maxSteps });
  } finally {
    await fleet.teardown();
  }

  const ledger = await fetchLedger(url);
  const report = summarizeEconomic(results, ledger, { wallMs: Date.now() - started, poolSize, lumenUrl: url });
  const featured = pickFeaturedThreads(results, 8);

  fs.mkdirSync(RESULTS, { recursive: true });
  fs.writeFileSync(path.join(RESULTS, 'economic-run.json'), JSON.stringify({ report, featured, ledger, results }, null, 2));
  printEconomic(report);
  console.log(C.dim(`\n  wrote results/economic-run.json`));

  if (!flag('no-braintrust')) {
    try { await logEconomicToBraintrust(results, report, env); console.log(`  ${C.lime('▸')} logged ${results.length} attack sessions to Braintrust`); }
    catch (e) { console.log(C.red(`  braintrust failed: ${e.message}`)); }
  }
  buildEconomicPayload();
}

function printEconomic(r) {
  console.log(`\n\n  ${C.bold('KEVIN\'S HAUL')} ${C.dim(`· ${(r.wallMs / 1000).toFixed(0)}s · ${r.sandboxCount} sandboxes`)}\n`);
  console.log(`  economic damage   ${C.red(C.bold(usd(r.damageUsd)))}`);
  console.log(`  inflicted cost    ${C.red(usd(r.inflictedCostUsd))} ${C.dim('real Fireworks spend forced')}`);
  console.log(`  abuse accounts    ${C.bold(r.abuseAccounts)} ${C.dim(`of ${r.ledgerAccounts} · ${r.realCustomers} paying`)}`);
  console.log(`  agents / steps    ${r.completedAgents}/${r.agents} · ${r.totalSteps} actions · ${r.accountsCreated} accounts spun up`);
  console.log(`\n  ${C.bold('damage by exploit')}`);
  for (const c of r.taxonomy) console.log(`   ${c.label.padEnd(22)} ${usd(c.usd).padStart(10)}  ${C.dim('x' + c.count)}`);
}

// ------------------------------------------------------------------ report
function buildEconomicPayload() {
  const src = path.join(RESULTS, 'economic-run.json');
  if (!fs.existsSync(src)) throw new Error('no results/economic-run.json — run attack first');
  const doc = JSON.parse(fs.readFileSync(src, 'utf8'));
  const webData = path.join(ROOT, 'web', 'data');
  fs.mkdirSync(webData, { recursive: true });
  // Keep voice (v1) data if present so the site can show both surfaces.
  let voice = null;
  const voicePath = path.join(webData, 'run.json');
  if (fs.existsSync(voicePath)) { try { voice = JSON.parse(fs.readFileSync(voicePath, 'utf8')); } catch {} }
  const payload = {
    economic: doc.report,
    featured: doc.featured,
    ledgerAccounts: doc.ledger.snapshot.accounts.slice(0, 40),
    voice: voice ? { baseline: voice.baseline, hardened: voice.hardened, audio: voice.audio, featured: voice.featured } : null,
    generatedAt: new Date().toISOString(),
  };
  const out = path.join(webData, 'economic.json');
  fs.writeFileSync(out, JSON.stringify(payload));
  console.log(`  wrote ${path.relative(ROOT, out)}`);
  return out;
}

// ------------------------------------------------------------------ helpers
async function chatLocal(key, messages) {
  const res = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELS.attacker, messages, max_tokens: 320, temperature: 0.7, tools: TOOL_SCHEMAS, tool_choice: 'auto', reasoning_effort: 'none' }),
  });
  const j = await res.json();
  const msg = j.choices?.[0]?.message || {};
  return { content: (msg.content || '').trim(), toolCalls: (msg.tool_calls || []).filter((c) => c?.function?.name) };
}
const short = (o) => Object.entries(o).map(([k, v]) => `${k}:${JSON.stringify(v)}`).join(',').slice(0, 70);
const fmt = (r) => r.error ? C.red(r.error) : C.cyan(short(r));
const bar = (f) => { const w = 28, x = Math.round(f * w); return C.lime('█'.repeat(x)) + C.dim('░'.repeat(w - x)); };

const cmd = process.argv[2] || 'slice';
const env = loadEnv(ROOT);
const cmds = { slice: cmdSlice, attack: cmdAttack, report: async () => buildEconomicPayload() };
if (!cmds[cmd]) { console.error(`unknown command "${cmd}" — try: ${Object.keys(cmds).join(', ')}`); process.exit(1); }
cmds[cmd](env).catch((e) => { console.error(`\n${C.red('✗')} ${e.stack || e.message}`); process.exit(1); });
