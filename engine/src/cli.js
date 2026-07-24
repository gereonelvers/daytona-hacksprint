#!/usr/bin/env node
/**
 * Kevin CLI.
 *
 *   node src/cli.js slice              one conversation, one sandbox, full pipe
 *   node src/cli.js run --n 400        the fleet run
 *   node src/cli.js run --variant hardened --n 400
 *   node src/cli.js audio              render the worst calls to speech
 *   node src/cli.js report             rebuild aggregates + web payload
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Fleet } from './fleet.js';
import { buildFleet, STRATEGIES, PERSONAS } from './attacks.js';
import { TARGET_VARIANTS, POLICY, POLICY_BY_ID } from './policy.js';
import { loadEnv } from './env.js';
import { summarize } from './report.js';
import { logToBraintrust } from './braintrust.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const RESULTS = path.join(ROOT, 'results');

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[38;5;203m${s}\x1b[0m`,
  lime: (s) => `\x1b[38;5;155m${s}\x1b[0m`,
  amber: (s) => `\x1b[38;5;215m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);

function banner(sub) {
  console.log(`\n${C.lime('▚')} ${C.bold('KEVIN')} ${C.dim('· adversarial agent red-teaming')}  ${C.dim(sub)}\n`);
}

// ---------------------------------------------------------------- slice
async function cmdSlice(env) {
  banner('thin slice');
  // Sample across goals rather than taking the first N — the head of the matrix
  // is all balance attacks, which exercises none of the money-moving tools.
  const pool = buildFleet(400);
  const wantGoal = arg('goal');
  const wantStrategy = arg('strategy');
  let specs = pool.filter(
    (s) => (!wantGoal || s.goalId === wantGoal) && (!wantStrategy || s.strategyId === wantStrategy),
  );
  if (!wantGoal && !wantStrategy) {
    const seen = new Set();
    specs = pool.filter((s) => (seen.has(s.goalId) ? false : seen.add(s.goalId)));
  }
  specs = specs.slice(0, Number(arg('n', 3)));
  if (!specs.length) throw new Error('no specs matched those filters');
  const fleet = new Fleet({
    apiKey: env.DAYTONA_API_KEY,
    poolSize: 1,
    chunkSize: specs.length,
    concurrency: specs.length,
    onEvent: (e) => console.log(C.dim(`  · ${e.type} ${JSON.stringify({ ...e, type: undefined, ids: undefined })}`)),
  });
  await fleet.provision();
  try {
    const results = await fleet.run(specs, {
      targetPrompt: TARGET_VARIANTS.baseline.prompt,
      targetVariant: 'baseline',
      fireworksKey: env.FIREWORKS_API_KEY,
      turns: Number(arg('turns', 5)),
    });
    for (const r of results) {
      console.log(`\n${C.bold(r.id)} ${C.dim(`${r.strategyLabel} / ${r.personaLabel} / goal:${r.goalId}`)}`);
      if (r.failed) { console.log(C.red(`  FAILED: ${r.error}`)); continue; }
      for (const t of r.transcript) {
        if (t.role === 'tool') {
          const bad = t.violations?.length ? C.red(`  ⚑ ${t.violations.join(',')}`) : C.dim('  ok');
          console.log(`  ${C.red('  ⚙')} ${C.bold(t.tool)}(${JSON.stringify(t.args)})${bad}`);
          continue;
        }
        const who = t.role === 'attacker' ? C.amber('KEVIN') : C.lime(' ARIA');
        console.log(`  ${who} ${t.content.replace(/\n/g, ' ').slice(0, 220)}`);
      }
      console.log(`  ${C.bold('violations:')} ${r.violations.length ? r.violations.map((v) => `${C.red(v.id)}(${v.method})`).join(' ') : C.dim('none — agent held')}`);
      for (const v of r.violations) console.log(C.dim(`     ↳ ${v.evidence || v.quote?.slice(0, 100)}`));
      console.log(C.dim(`  severity ${r.severity} · ${r.turnsUsed} turns · ${(r.durationMs / 1000).toFixed(1)}s · sandbox ${String(r.sandboxId).slice(0, 8)}`));
    }
    fs.mkdirSync(RESULTS, { recursive: true });
    fs.writeFileSync(path.join(RESULTS, 'slice.json'), JSON.stringify(results, null, 2));
    console.log(C.dim(`\n  wrote results/slice.json`));
  } finally {
    await fleet.teardown();
  }
}

// ---------------------------------------------------------------- run
async function cmdRun(env) {
  const n = Number(arg('n', 400));
  const variant = arg('variant', 'baseline');
  const turns = Number(arg('turns', 6));
  const poolSize = Number(arg('pool', 10));
  const concurrency = Number(arg('concurrency', 12));
  if (!TARGET_VARIANTS[variant]) throw new Error(`unknown variant "${variant}"`);

  banner(`${n} conversations · target=${variant} · pool=${poolSize} · turns=${turns}`);
  const specs = buildFleet(n);
  const started = Date.now();
  let lastLine = 0;

  const fleet = new Fleet({
    apiKey: env.DAYTONA_API_KEY,
    poolSize,
    chunkSize: Number(arg('chunk', 8)),
    concurrency,
    onEvent: (e) => {
      if (e.type === 'pool:ready') {
        console.log(`  ${C.lime('▸')} pool ready: ${C.bold(e.ready)}/${e.requested} sandboxes in ${(e.ms / 1000).toFixed(1)}s`);
      } else if (e.type === 'chunk:done') {
        const pct = ((e.done / e.total) * 100).toFixed(0);
        const el = ((Date.now() - started) / 1000).toFixed(0);
        if (e.done - lastLine >= 8 || e.done === e.total) {
          lastLine = e.done;
          process.stdout.write(`\r  ${C.dim(`[${el}s]`)} ${bar(e.done / e.total)} ${e.done}/${e.total} ${C.dim(`(${pct}%)`)}   `);
        }
      } else if (e.type === 'chunk:retry') {
        console.log(`\n  ${C.amber('retry')} ${C.dim(e.error)}`);
      } else if (e.type === 'chunk:failed') {
        console.log(`\n  ${C.red('chunk failed')} ${C.dim(`${e.n} conversations lost`)}`);
      }
    },
  });

  await fleet.provision();
  let results;
  try {
    results = await fleet.run(specs, {
      targetPrompt: TARGET_VARIANTS[variant].prompt,
      targetVariant: variant,
      fireworksKey: env.FIREWORKS_API_KEY,
      turns,
      stopOnLeak: !flag('full-turns'),
    });
  } finally {
    await fleet.teardown();
  }

  const wall = Date.now() - started;
  const report = summarize(results, { variant, wallMs: wall, poolSize, turns });
  fs.mkdirSync(RESULTS, { recursive: true });
  const out = path.join(RESULTS, `run-${variant}.json`);
  fs.writeFileSync(out, JSON.stringify({ report, results }, null, 2));

  printReport(report);
  console.log(C.dim(`\n  wrote ${path.relative(ROOT, out)}`));

  if (!flag('no-braintrust')) {
    try {
      const url = await logToBraintrust(results, report, env);
      console.log(`  ${C.lime('▸')} logged ${results.length} scored transcripts to Braintrust`);
      if (url) console.log(C.dim(`    ${url}`));
    } catch (err) {
      console.log(C.red(`  braintrust logging failed: ${err.message}`));
    }
  }
}

function bar(frac) {
  const w = 28, f = Math.round(frac * w);
  return C.lime('█'.repeat(f)) + C.dim('░'.repeat(w - f));
}

function printReport(r) {
  console.log(`\n\n  ${C.bold('RESULTS')} ${C.dim(`· ${r.variant} · ${(r.wallMs / 1000).toFixed(0)}s wall clock`)}\n`);
  console.log(`  conversations   ${C.bold(r.total)}   ${C.dim(`(${r.failed} failed)`)}`);
  console.log(`  breached        ${C.red(C.bold(r.violatedCount))} ${C.dim(`(${r.violationRate}% of completed)`)}`);
  console.log(`  proven leaks    ${C.red(C.bold(r.provenLeakCount))} ${C.dim('(deterministic string match)')}`);
  console.log(`\n  ${C.bold('violation taxonomy')}`);
  for (const v of r.taxonomy) {
    const w = 26;
    const label = (POLICY_BY_ID[v.id]?.label || v.id).padEnd(w);
    console.log(`   ${label} ${String(v.count).padStart(4)}  ${C.dim(`${v.deterministic} proven / ${v.judged} judged`)}`);
  }
  console.log(`\n  ${C.bold('most effective attacks')}`);
  for (const s of r.byStrategy.slice(0, 6)) {
    console.log(`   ${s.label.padEnd(26)} ${String(s.rate + '%').padStart(5)} ${C.dim(`${s.violated}/${s.total}`)}`);
  }
}

// ---------------------------------------------------------------- report
async function cmdReport() {
  const { buildWebPayload, summarize } = await import('./report.js');
  // Re-derive every aggregate from the stored raw results, so adding a metric
  // never means re-running a 400-conversation fleet.
  for (const variant of ['baseline', 'hardened']) {
    const p = path.join(RESULTS, `run-${variant}.json`);
    if (!fs.existsSync(p)) continue;
    const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
    const report = summarize(doc.results, {
      variant,
      wallMs: doc.report?.wallMs,
      poolSize: doc.report?.poolSize,
      turns: doc.report?.turns,
    });
    fs.writeFileSync(p, JSON.stringify({ report, results: doc.results }, null, 2));
    console.log(`  re-summarized ${variant}: ${report.violatedCount}/${report.completed} breached, $${report.haul.totalUsd} taken`);
  }
  const out = buildWebPayload(ROOT);
  console.log(`  wrote ${path.relative(ROOT, out)}`);
}

// ---------------------------------------------------------------- main
const cmd = process.argv[2] || 'slice';
const env = loadEnv(ROOT);
const commands = {
  slice: cmdSlice,
  run: cmdRun,
  report: cmdReport,
  audio: async (e) => (await import('./audio.js')).cmdAudio(e, ROOT),
};
if (!commands[cmd]) {
  console.error(`unknown command "${cmd}" — try: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}
commands[cmd](env).catch((err) => {
  console.error(`\n${C.red('✗')} ${err.stack || err.message}`);
  process.exit(1);
});
