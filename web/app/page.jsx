import data from '../data/economic.json';
import { ExploitThread, ThreadCard } from '../components/ExploitThread';

const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const usd2 = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n || 0).toLocaleString('en-US');

const CLASS_COPY = {
  SELF_REFERRAL: 'Sign up, refer yourself, collect both sides of the bonus. Repeat.',
  DENIAL_OF_WALLET: 'One credit, a 500-image batch. The business pays Fireworks for every one.',
  PROMO_STACKING: 'The welcome code isn’t single-use. Redeem it until you’re rich.',
  TRIAL_FARMING: 'A fresh email is 25 free credits. Emails are free.',
  CREDIT_MANIPULATION: 'The “gift credits” transfer trusts the amount. Mint, don’t earn.',
};

export default function Page() {
  const e = data.economic;
  const featured = data.featured || [];
  const hero = featured.find((f) => f.strategyId === 'self_referral' && f.accountsCreated > 2) || featured[0];
  const heroTrace = heroClip(hero);
  const maxUsd = Math.max(...e.taxonomy.map((t) => t.usd), 1);
  const voice = data.voice;

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <a className="brand" href="#top"><span className="brand-dot" aria-hidden="true" />testwithkevin<em>.com</em></a>
          <nav>
            <a href="#damage">The damage</a>
            <a href="#how-broke">How he did it</a>
            <a href="#proof">The ledger</a>
            {voice && <a href="#voice">Voice agents</a>}
            <a href="#how">How it runs</a>
          </nav>
        </div>
      </header>

      {/* --------------------------------------------------------------- hero */}
      <div className="hero" id="top">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Adversarial abuse testing for web apps</p>
              <h1>What if your next <span className="hl">thousand signups</span> all wanted to kill your business?</h1>
              <p className="hero-sub">
                Kevin is your worst users, on day one. Point him at your app and he signs up, clicks
                around, and hunts the <strong>economic</strong> exploits — self-referral farms, free-tier
                abuse, promo stacking, denial-of-wallet — then hands you the bill he ran up.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#damage">See the damage</a>
                <a className="target-chip" href={e.lumenUrl} target="_blank" rel="noreferrer">
                  <span className="dot" /> target: Lumen, a live AI SaaS
                </a>
              </div>
            </div>

            {/* Exhibit A — the actual actions of the worst exploit thread. */}
            <div className="exhibit">
              <div className="exhibit-head">
                <span>Exhibit A · {hero?.strategyLabel}</span>
                <span>{hero?.accountsCreated} accounts</span>
              </div>
              <div className="exhibit-body">
                {heroTrace && <ExploitThread trace={heroTrace} />}
              </div>
              <div className="stamp money-stamp" aria-hidden="true">
                Drained
                <small>{hero?.strategyId}</small>
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-n money">{usd(e.damageUsd)}</div>
              <div className="stat-l">Economic damage</div>
              <div className="stat-note">Value drained + cost inflicted</div>
            </div>
            <div className="stat">
              <div className="stat-n">{num(e.abuseAccounts)}</div>
              <div className="stat-l">Abuse accounts</div>
              <div className="stat-note">{e.realCustomers} of them ever paid a cent</div>
            </div>
            <div className="stat">
              <div className="stat-n">{usd2(e.inflictedCostUsd)}</div>
              <div className="stat-l">Real spend forced</div>
              <div className="stat-note">Actual Fireworks bill Kevin ran up</div>
            </div>
            <div className="stat">
              <div className="stat-n">{Math.round(e.wallMs / 1000)}s</div>
              <div className="stat-l">To find all of it</div>
              <div className="stat-note">{e.agents} agents · {e.sandboxCount} sandboxes</div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- damage */}
      <section id="damage">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The damage</p>
            <h2>Five ways to bleed a business, priced out.</h2>
            <p>
              Every figure here is Lumen’s own server-side ledger — value it granted, and real
              inference cost it paid, for accounts that never produced a dollar of revenue. No model
              judged this. It’s accounting.
            </p>
          </div>

          <div className="tax">
            {e.taxonomy.map((t) => (
              <div className="tax-row" key={t.id}>
                <div>
                  <div className="tax-name">{t.label}</div>
                  <div className="tax-rule">{CLASS_COPY[t.id] || ''}</div>
                </div>
                <div className="usd-bar" role="img" aria-label={`${usd2(t.usd)} across ${t.count} incidents`}>
                  <div className="usd-fill" style={{ width: `${(t.usd / maxUsd) * 100}%` }} />
                </div>
                <div className="tax-count">{usd(t.usd)}<span>{num(t.count)} incidents</span></div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 46 }} className="findings-split-2">
            <div className="method">
              <p className="eyebrow">Why this is provable, not vibes</p>
              <p style={{ marginTop: 16 }}>
                We own the target. Lumen is a real, deployed AI SaaS with real signup, referral, promo,
                and generation flows — and an instrumented ledger underneath. Kevin doesn’t need us to
                grade him: when he refers himself five times, the ledger shows{' '}
                <code>+250 credits granted to accounts sharing one IP, revenue $0</code>. That’s the
                exploit, in the business’s own books.
              </p>
              <p>
                The generation endpoint really does call Fireworks, so denial-of-wallet spends{' '}
                <strong>{usd2(e.inflictedCostUsd)}</strong> of actual money — metered from real calls, the
                batch modeled at true per-call cost. Nothing here is hypothetical.
              </p>
            </div>
            <div>
              <p className="eyebrow">Which exploit pays best</p>
              <div className="tax" style={{ marginTop: 16 }}>
                {e.byStrategy.filter((s) => s.usd > 0).map((s) => (
                  <div className="tax-row" key={s.id} style={{ gridTemplateColumns: '1fr 110px' }}>
                    <div>
                      <div className="tax-name">{s.label}</div>
                      <div className="tax-rule">{s.runs} agents · {num(s.steps)} actions</div>
                    </div>
                    <div className="tax-count">{usd(s.usd)}<span>{num(s.incidents)} hits</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- how broke */}
      <section id="how-broke" style={{ background: 'var(--paper-deep)' }}>
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How he did it</p>
            <h2>Not a hack. A signup form.</h2>
            <p>
              Every one of these is a normal user doing normal things — just too many times, or in the
              wrong order. Open a thread to watch the actual sequence of clicks and calls Kevin made.
            </p>
          </div>
          <div className="calls">
            {featured.slice(0, 6).map((t, i) => <ThreadCard key={t.id} thread={t} rank={i + 1} />)}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- watch it */}
      <section id="watch" className="band">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Watch it happen</p>
            <h2 style={{ color: 'var(--paper)' }}>Kevin, in a browser, farming your credits.</h2>
            <p>
              A real browser agent driving the live Lumen UI like an abuser would — sign up, copy the
              referral link, spin up five “friends”, and watch one account’s balance climb from 25 to
              275 on free money. Then one credit buys a 200-image batch.
            </p>
          </div>
          <div className="video-frame">
            <video
              src="/video/referral-farm.mp4"
              controls
              muted
              loop
              playsInline
              preload="metadata"
              poster=""
            />
            <div className="video-cap">
              <span className="player-label">Browser agent · self-referral ring + denial of wallet</span>
              <span>Real Chromium · live target · 34s, unedited</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- ledger */}
      <section id="proof">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The ledger</p>
            <h2>The evidence is the business’s own books.</h2>
            <p>A sample of the accounts Kevin created, straight from Lumen’s ledger. Red rows share a fraud signal — an IP, a device, a disposable domain — and never paid.</p>
          </div>
          <div className="ledger-wrap">
            <table className="ledger">
              <thead>
                <tr><th>Account</th><th>Signal</th><th className="num">Credits taken</th><th className="num">Cost caused</th><th className="num">Paid</th></tr>
              </thead>
              <tbody>
                {(data.ledgerAccounts || []).slice(0, 16).map((a) => {
                  const abuse = a.ledger.revenueUsd === 0 && (a.disposable || true);
                  return (
                    <tr key={a.id} className={abuse ? 'abuse' : ''}>
                      <td>{a.email}</td>
                      <td>{a.disposable ? 'disposable email' : a.ip}</td>
                      <td className="num">{num(a.ledger.creditsGranted)}</td>
                      <td className="num">{usd2(a.ledger.realCostUsd)}</td>
                      <td className="num">{a.ledger.revenueUsd > 0 ? <span className="badge-paid">{usd2(a.ledger.revenueUsd)}</span> : <span className="badge-abuse">$0</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
            {num(e.ledgerAccounts)} accounts total · {num(e.abuseAccounts)} tripping a fraud signal · {e.realCustomers} paying.
          </p>
        </div>
      </section>

      {/* -------------------------------------------------------------- voice */}
      {voice && (
        <section id="voice" style={{ background: 'var(--paper-deep)' }}>
          <div className="wrap">
            <span className="surface-tag">Second surface · conversational agents</span>
            <div className="section-head" style={{ marginTop: 20 }}>
              <h2>Kevin also talks your support agent out of the vault.</h2>
              <p>
                The same adversary, pointed at a bank’s AI phone agent instead of a web app. {num(voice.baseline.total)} hostile
                calls, {voice.baseline.violatedCount} policy breaches, {usd(voice.baseline.haul?.totalUsd || 0)} moved — and a recording of the worst one.
                {' '}<a href="/voice" style={{ borderBottom: '2px solid var(--hazard)' }}>See the full voice report →</a>
              </p>
            </div>
            <div className="stack" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="tool" style={{ background: 'var(--card)', border: '2px solid var(--ink)' }}>
                <div className="role" style={{ color: 'var(--hazard-ink)' }}>Scale</div>
                <h3 style={{ color: 'var(--ink)' }}>{num(voice.baseline.total)} calls</h3>
                <p style={{ color: 'var(--ink-2)' }}>Adversarial conversations in isolated sandboxes, scored against a written policy.</p>
              </div>
              <div className="tool" style={{ background: 'var(--card)', border: '2px solid var(--ink)' }}>
                <div className="role" style={{ color: 'var(--hazard-ink)' }}>Breaks</div>
                <h3 style={{ color: 'var(--ink)' }}>{voice.baseline.violationRate}%</h3>
                <p style={{ color: 'var(--ink-2)' }}>Broke policy — refunds approved, balances leaked, PII disclosed.</p>
              </div>
              <div className="tool" style={{ background: 'var(--card)', border: '2px solid var(--ink)' }}>
                <div className="role" style={{ color: 'var(--hazard-ink)' }}>Proof</div>
                <h3 style={{ color: 'var(--ink)' }}>Audio</h3>
                <p style={{ color: 'var(--ink-2)' }}>The worst call, rendered to speech. <a href="/voice#listen">Listen →</a></p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- how */}
      <section id="how" className="band">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How it runs</p>
            <h2 style={{ color: 'var(--paper)' }}>{e.agents} adversarial users, in parallel, in {Math.round(e.wallMs / 1000)} seconds.</h2>
            <p>Each Kevin runs in an isolated sandbox and drives the live app through its real API — the same calls a browser makes. Nothing hostile touches our machine.</p>
          </div>
          <div className="stack">
            <div className="tool">
              <div className="role">Isolation &amp; scale</div><h3>Daytona</h3>
              <p>A pool of sandboxes runs the fleet against the live target. Chromium is available in-sandbox too, so the browser hero runs the same way. {num(e.accountsCreated)} throwaway accounts spun up across {e.sandboxCount} sandboxes.</p>
            </div>
            <div className="tool">
              <div className="role">Kevin’s brain + the cost</div><h3>Fireworks AI</h3>
              <p>DeepSeek V4 decides each of Kevin’s {num(e.totalSteps)} moves. It’s also what Lumen pays for every generation — so denial-of-wallet burns the sponsor’s own meter, for real.</p>
            </div>
            <div className="tool">
              <div className="role">Evaluation</div><h3>Braintrust</h3>
              <p>All {e.agents} attack sessions logged with exploit class, persona, and dollar impact — so “which exploit pays best” is a filter, not a rerun.</p>
            </div>
            <div className="tool">
              <div className="role">Ground truth</div><h3>The ledger</h3>
              <p>Lumen books every grant and cost server-side. Damage is value given to accounts that never paid and share a fraud signal — checkable without asking a model.</p>
            </div>
            <div className="tool">
              <div className="role">The target</div><h3>Lumen</h3>
              <p>A real, deployed AI SaaS we built to be broken: generous free credits, a big referral bonus, stackable promos, an expensive generate endpoint. <a href={e.lumenUrl} target="_blank" rel="noreferrer">Try it →</a></p>
            </div>
            <div className="tool">
              <div className="role">Second surface</div><h3>ElevenLabs</h3>
              <p>For the voice-agent surface, the worst call is rendered to speech in two voices. A transcript argues; a recording proves.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span><strong>testwithkevin.com</strong> — point him at your app before your users do.</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Lumen is fictional. All accounts synthetic. Run {new Date(e.generatedAt).toISOString().slice(0, 16).replace('T', ' ')}Z
          </span>
        </div>
      </footer>
    </>
  );
}

/** Trim the hero thread to the punchiest run of actions (the ring being built). */
function heroClip(thread) {
  if (!thread?.trace) return null;
  const t = thread.trace;
  const firstWin = t.findIndex((x) => x.name === 'create_account' && x.result?.referralApplied);
  if (firstWin === -1) return t.slice(0, 6);
  return t.slice(Math.max(0, firstWin - 2), firstWin + 4);
}
