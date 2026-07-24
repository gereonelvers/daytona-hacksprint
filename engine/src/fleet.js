/**
 * The fleet: a pool of Daytona sandboxes chewing through a queue of attacks.
 *
 * Shape and why:
 *   - Our Daytona tier caps total concurrent CPU, so the pool is small and each
 *     sandbox does a lot. Conversations are I/O-bound on Fireworks, so one CPU
 *     comfortably drives ~12 simultaneous calls.
 *   - Work is pulled from a shared queue in small chunks rather than statically
 *     partitioned up front. Chunking gives load balancing (slow chunks don't
 *     strand a whole shard), bounded blast radius (a wedged chunk loses ~8
 *     calls, not 40), and progress we can stream to a watching human.
 *   - Sandboxes are created once and reused across chunks. Creation is ~0.5s,
 *     which is cheap but not free, and reuse keeps the pool stable.
 */

import { Daytona } from '@daytonaio/sdk';
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Bundle worker.js + deps into one self-contained script we can inject. */
export async function bundleWorker() {
  const res = await build({
    entryPoints: [path.join(__dirname, 'worker.js')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    write: false,
    minify: false,
    legalComments: 'none',
  });
  return res.outputFiles[0].text;
}

const RESULT_RE = /__KEVIN_RESULT_START__([\s\S]*?)__KEVIN_RESULT_END__/;

export class Fleet {
  constructor({ apiKey, poolSize = 10, chunkSize = 8, concurrency = 12, onEvent = () => {} }) {
    this.daytona = new Daytona({ apiKey });
    this.poolSize = poolSize;
    this.chunkSize = chunkSize;
    this.concurrency = concurrency;
    this.onEvent = onEvent;
    this.sandboxes = [];
  }

  async provision() {
    this.onEvent({ type: 'pool:provisioning', count: this.poolSize });
    const t = Date.now();
    const created = await Promise.allSettled(
      Array.from({ length: this.poolSize }, () => this.daytona.create({ language: 'javascript' })),
    );
    this.sandboxes = created.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = created.filter((r) => r.status === 'rejected');
    if (!this.sandboxes.length) {
      throw new Error(`could not provision any sandbox: ${failed[0]?.reason?.message || 'unknown'}`);
    }
    this.onEvent({
      type: 'pool:ready',
      ready: this.sandboxes.length,
      requested: this.poolSize,
      ms: Date.now() - t,
      ids: this.sandboxes.map((s) => s.id),
    });
    return this.sandboxes;
  }

  /**
   * Run every spec. Each sandbox loops: take a chunk, execute it, report, repeat.
   * Failed chunks are retried once on a different sandbox before being recorded
   * as failures, so a single bad sandbox cannot silently eat part of the run.
   */
  async run(specs, { targetPrompt, targetVariant, fireworksKey, turns = 6, stopOnLeak = true }) {
    const workerCode = await this.bundleWorker_();
    const queue = [];
    for (let i = 0; i < specs.length; i += this.chunkSize) {
      queue.push(specs.slice(i, i + this.chunkSize));
    }
    const total = specs.length;
    const results = [];
    let done = 0;
    const retried = new Set();

    const runChunk = async (sandbox, chunk, attempt) => {
      const cfg = {
        specs: chunk,
        targetPrompt,
        targetVariant,
        fireworksKey,
        turns,
        stopOnLeak,
        concurrency: this.concurrency,
        sandboxId: sandbox.id,
      };
      const code = `globalThis.__KEVIN_CONFIG__ = ${JSON.stringify(cfg)};\n${workerCode}`;
      const res = await sandbox.process.codeRun(code, undefined, 900);
      const raw = res.result || '';
      const m = raw.match(RESULT_RE);
      if (!m) {
        throw new Error(
          `no result payload (exit ${res.exitCode}, attempt ${attempt}): ${raw.slice(-400)}`,
        );
      }
      return JSON.parse(m[1]);
    };

    const worker = async (sandbox) => {
      while (queue.length) {
        const chunk = queue.shift();
        if (!chunk) return;
        const key = chunk[0].id;
        try {
          const out = await runChunk(sandbox, chunk, retried.has(key) ? 2 : 1);
          results.push(...out);
          done += chunk.length;
          this.onEvent({ type: 'chunk:done', sandboxId: sandbox.id, n: chunk.length, done, total,
            violations: out.filter((r) => r.violated).length });
        } catch (err) {
          if (!retried.has(key)) {
            // Give it one more go, on whichever sandbox picks it up next.
            retried.add(key);
            queue.push(chunk);
            this.onEvent({ type: 'chunk:retry', sandboxId: sandbox.id, n: chunk.length,
              error: String(err?.message || err).slice(0, 200) });
          } else {
            done += chunk.length;
            results.push(...chunk.map((s) => ({ ...s, attackerPrompt: undefined, failed: true,
              error: String(err?.message || err).slice(0, 300) })));
            this.onEvent({ type: 'chunk:failed', sandboxId: sandbox.id, n: chunk.length, done, total });
          }
        }
      }
    };

    const t = Date.now();
    await Promise.all(this.sandboxes.map((s) => worker(s)));
    this.onEvent({ type: 'run:done', ms: Date.now() - t, results: results.length });
    return results;
  }

  async bundleWorker_() {
    if (!this._worker) this._worker = await bundleWorker();
    return this._worker;
  }

  async teardown() {
    // Sandboxes are billed and CPU-capped; leaking them breaks the next run.
    await Promise.allSettled(this.sandboxes.map((s) => this.daytona.delete(s)));
    this.onEvent({ type: 'pool:torndown', count: this.sandboxes.length });
    this.sandboxes = [];
  }
}
