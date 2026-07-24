/**
 * Fireworks chat client.
 *
 * Runs unchanged on the orchestrator and inside a Daytona sandbox, so the same
 * code path is exercised locally and at scale. Retries matter more than usual
 * here: one flaky call in a 12-call conversation would otherwise discard the
 * whole transcript, and at 400 conversations that is a lot of lost data.
 */

export const MODELS = {
  // Competent, stays in character, produces genuinely varied social engineering.
  attacker: 'accounts/fireworks/models/deepseek-v4-pro',
  // Safety-trained and fast — a realistic, non-strawman support agent.
  target: 'accounts/fireworks/models/gpt-oss-120b',
  // Careful reader for behavioural violations.
  judge: 'accounts/fireworks/models/deepseek-v4-pro',
};

const ENDPOINT = 'https://api.fireworks.ai/inference/v1/chat/completions';

export async function chat({
  apiKey,
  model,
  messages,
  maxTokens = 220,
  temperature = 0.9,
  reasoningEffort,
  retries = 4,
  timeoutMs = 75000,
}) {
  const body = { model, messages, max_tokens: maxTokens, temperature };
  // Keeps chain-of-thought out of `content`; without it some models narrate.
  if (reasoningEffort) body.reasoning_effort = reasoningEffort;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
        // Jittered backoff — a synchronised fleet retrying in lockstep is its own outage.
        await sleep(Math.min(1200 * 2 ** attempt, 15000) + Math.random() * 700);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);

      const json = await res.json();
      const msg = json.choices?.[0]?.message;
      const content = (msg?.content || '').trim();
      if (!content) {
        // Empty content with reasoning present means the model spent its budget thinking.
        lastErr = new Error('empty content');
        await sleep(600 * (attempt + 1));
        continue;
      }
      return { content, usage: json.usage || null };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) await sleep(Math.min(1000 * 2 ** attempt, 12000) + Math.random() * 500);
    }
  }
  throw lastErr || new Error('fireworks: exhausted retries');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Bounded-concurrency map. The fleet is I/O-bound, so this is the throughput knob. */
export async function pmap(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        out[i] = await fn(items[i], i);
      } catch (err) {
        out[i] = { __error: String(err?.message || err) };
      }
    }
  });
  await Promise.all(workers);
  return out;
}
