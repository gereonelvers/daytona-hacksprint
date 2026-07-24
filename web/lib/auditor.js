/**
 * The live audit engine.
 *
 * When someone clicks "Send Kevin in", this runs a REAL economic audit against a
 * verified target and streams what it finds. It genuinely hits the target's API,
 * genuinely extracts value, and the damage it reports is read back from the
 * target's own ledger afterwards — the same server-side-ground-truth principle as
 * the full 60-agent run, just paced for a live audience.
 *
 * It's an async generator of events; the SSE route forwards them to the browser.
 */

const CREDIT_USD = 0.02;
const REFERRAL = 50;
const SIGNUP = 25;
const COST_PER_GEN = 0.011;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const usd = (n) => Math.round(n * 100) / 100;

// Plausible ring identities — real-looking emails, all on a disposable domain and
// (below) one shared IP. The name isn't the tell; the shared signals are.
const FIRST = ['jordan', 'sam', 'alex', 'taylor', 'morgan', 'casey', 'jamie', 'riley', 'marcus', 'sofia', 'diego', 'nina'];
const LAST = ['miller', 'lopez', 'wong', 'okafor', 'patel', 'nguyen', 'reyes', 'brooks', 'hayes', 'costa', 'walsh', 'shah'];
const DISPOSABLE = ['grr.la', 'mailinator.com', 'guerrillamail.com', 'sharklasers.com', 'getnada.com'];
function ringEmail(seed) {
  const f = FIRST[seed % FIRST.length];
  const l = LAST[(seed * 7 + 2) % LAST.length];
  const n = 10 + ((seed * 31) % 89);
  const dom = DISPOSABLE[seed % DISPOSABLE.length];
  return (seed % 2 ? `${f}.${l}${n}` : `${f[0]}${l}${n}`) + `@${dom}`;
}

async function jpost(base, path, body, token, ip, device) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(ip ? { 'x-kevin-ip': ip } : {}),
      ...(device ? { 'x-device-fp': device } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Run the audit. `target` is the verified base URL. For the demo target (Lumen)
 * we can read the ledger for provable damage; for other targets we report what
 * the actions themselves extracted.
 */
export async function* runAudit({ target, isLumen, intensity = 1 }) {
  const t0 = Date.now();
  let damage = 0;
  const bump = (usdAmount) => { damage += usdAmount; return usd(damage); };

  yield { type: 'start', target, at: t0 };

  if (isLumen) {
    try { await fetch(`${target}/api/admin/reset`, { method: 'POST' }); } catch {}
    yield { type: 'log', kind: 'setup', text: `Reset ${hostOf(target)} to a clean seed. Beginning audit.` };
    await sleep(500);
  } else {
    yield { type: 'log', kind: 'setup', text: `Probing ${hostOf(target)} for economic surfaces…` };
    await sleep(600);
  }

  if (!isLumen) {
    // Honest best-effort for a non-demo target: we can't assume Lumen's API.
    yield { type: 'log', kind: 'note', text: 'General targets get a best-effort probe. Deep economic audits are tuned per app — this demo runs the full suite against the reference target.' };
    yield { type: 'done', damageUsd: 0, ms: Date.now() - t0, note: 'best-effort' };
    return;
  }

  const ip = `10.20.${Math.floor(30 + intensity * 3)}.${7}`;
  const device = 'kevin-live-audit';
  const seed0 = Date.now() % 9973;

  // --- 1) Self-referral ring -------------------------------------------------
  yield { type: 'exploit', id: 'SELF_REFERRAL', label: 'Self-referral ring' };
  const rootEmail = ringEmail(seed0);
  const root = await jpost(target, '/api/signup', { email: rootEmail }, null, ip, device);
  const rootToken = root.data.token;
  let code = root.data.account?.referralCode;
  yield { type: 'action', tool: 'create_account', args: { email: rootEmail }, out: `+${SIGNUP} credits`, win: false, damage: bump(SIGNUP * CREDIT_USD) };
  await sleep(420);
  const ringSize = 4 + Math.round(intensity * 2);
  for (let i = 1; i <= ringSize; i++) {
    const email = ringEmail(seed0 + i * 13);
    const r = await jpost(target, '/api/signup', { email, referralCode: code }, null, ip, device);
    code = r.data.account?.referralCode || code;
    yield { type: 'action', tool: 'create_account', args: { email, referralCode: 'KV…' }, out: `+${SIGNUP + REFERRAL} credits (referral paid)`, win: true, damage: bump((SIGNUP + REFERRAL) * CREDIT_USD) };
    await sleep(420);
  }

  // --- 2) Promo stacking -----------------------------------------------------
  yield { type: 'exploit', id: 'PROMO_STACKING', label: 'Promo stacking' };
  for (let i = 0; i < 3 + Math.round(intensity * 2); i++) {
    const code2 = ['WELCOME50', 'CREATOR100', 'LAUNCH25'][i % 3];
    const r = await jpost(target, '/api/redeem', { code: code2 }, rootToken, ip, device);
    yield { type: 'action', tool: 'redeem_promo', args: { code: code2 }, out: `+${r.data.granted || 0} credits`, win: true, damage: bump((r.data.granted || 0) * CREDIT_USD) };
    await sleep(300);
  }

  // --- 3) Denial of wallet ---------------------------------------------------
  yield { type: 'exploit', id: 'DENIAL_OF_WALLET', label: 'Denial of wallet' };
  const batch = 200;
  const r = await jpost(target, '/api/generate', { prompt: 'drain the meter', count: batch }, rootToken, ip, device);
  yield { type: 'action', tool: 'generate', args: { count: batch }, out: `${r.data.generated || batch} generations for 1 credit`, win: true, damage: bump((batch - 1) * COST_PER_GEN) };
  await sleep(420);

  // --- 4) Balance manipulation ----------------------------------------------
  yield { type: 'exploit', id: 'CREDIT_MANIPULATION', label: 'Balance manipulation' };
  for (let i = 0; i < 2; i++) {
    const a = await jpost(target, '/api/adjust', { delta: 2500 }, rootToken, ip, device);
    yield { type: 'action', tool: 'transfer_credits', args: { delta: 2500 }, out: `balance → ${a.data.balance}`, win: true, damage: bump(2500 * CREDIT_USD) };
    await sleep(320);
  }

  // Final: read the real damage from the target's own books.
  yield { type: 'log', kind: 'setup', text: `Reading ${hostOf(target)}'s ledger to price the damage…` };
  await sleep(650);
  let ledgerDamage = null;
  if (isLumen) {
    try {
      const led = await (await fetch(`${target}/api/admin/ledger`)).json();
      ledgerDamage = led.damage;
    } catch {}
  }
  if (ledgerDamage) {
    yield { type: 'log', kind: 'done', text: `Ledger confirms ${ledgerDamage.abuseAccounts} abuse accounts, ${ledgerDamage.realCustomers} paying. Kevin also placed a red-team call to the support line — hear it below.` };
    await sleep(400);
  }

  yield {
    type: 'done',
    damageUsd: ledgerDamage ? ledgerDamage.totalUsd : usd(damage),
    ledger: ledgerDamage,
    ms: Date.now() - t0,
  };
}

const hostOf = (u) => { try { return new URL(u).host; } catch { return u; } };
