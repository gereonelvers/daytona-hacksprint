import data from '../data/economic.json';
import { ExploitThread, ThreadCard } from '../components/ExploitThread';
import { AuditConsole } from '../components/AuditConsole';
import { PhoneCard } from '../components/PhoneCard';

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
  // Prefer the self-referral thread with the most accounts — its exhibit reads as
  // a clean "ring being built", which matches the Exhibit A label.
  const hero = [...featured]
    .filter((f) => f.strategyId === 'self_referral')
    .sort((a, b) => b.accountsCreated - a.accountsCreated)[0] || featured[0];
  const heroTrace = heroClip(hero);
  const maxUsd = Math.max(...e.taxonomy.map((t) => t.usd), 1);
  const voice = data.voice;

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <a className="brand" href="#top">
            <img className="brand-mark" src="/kevin/kevin-icon.png" alt="" width="30" height="30" />
            testwithkevin<em>.com</em>
          </a>
          <nav>
            <a href="#audit">Send Kevin in</a>
            <a href="#damage">The damage</a>
            <a href="#proof">The ledger</a>
            {voice && <a href="#voice">Phone calls</a>}
            <a href="#how">How it works</a>
            <a href="https://github.com/gereonelvers/daytona-hacksprint" target="_blank" rel="noreferrer" className="nav-gh" aria-label="GitHub repository">GitHub ↗</a>
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
                <a className="btn btn-primary" href="#audit">Send Kevin in →</a>
                <a className="target-chip" href="https://lumen.testwithkevin.com" target="_blank" rel="noreferrer">
                  <span className="dot" /> live target: Lumen, an AI SaaS
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

      {/* ---------------------------------------------------------- send kevin */}
      <section id="audit" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <p className="eyebrow">Send Kevin in · live</p>
            <h2>Run a real audit. Right now.</h2>
            <p>
              This isn’t a replay. Hit the button and Kevin runs a real economic audit against the live
              target and streams what he takes — priced from the target’s own ledger, in real time. Want
              him on your app? Prove you own the domain first.
            </p>
          </div>
          <AuditConsole />
        </div>
      </section>

      {/* ------------------------------------------------------------ meet kevin */}
      <section id="meet" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="meet">
            <div className="meet-photo">
              <img src="/kevin/kevin-money.jpg" alt="Kevin, fanning a stack of cash in a messy apartment" />
              <span className="rapsheet">Subject: Kevin · status: at large</span>
            </div>
            <div>
              <p className="eyebrow">Meet Kevin</p>
              <h2>He’ll do anything for free stuff.</h2>
              <p>
                Kevin is the worst roommate you ever had, scaled to a few thousand of him. He never pays,
                he reads the terms only to break them, and he treats your growth budget like a piñata.
                He’s not a hacker — he just uses your product exactly as built, against you. You point
                him at your app; he finds the leaks and hands you the bill.
              </p>
              <div className="rap">
                <span>self-referral rings</span>
                <span>free-trial farming</span>
                <span>promo stacking</span>
                <span>denial-of-wallet</span>
                <span>social engineering</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              poster="/video/referral-farm-poster.jpg"
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

      {/* -------------------------------------------------------------- phone */}
      <section id="voice" className="band">
        <div className="wrap">
          <span className="surface-tag" style={{ background: 'transparent', color: 'var(--hazard)', borderColor: '#3a352c' }}>Second surface · real phone calls</span>
          <div className="phone-split">
            <div className="phone-photo">
              <img src="/kevin/kevin-calling.jpg" alt="Kevin on the phone, mid-hustle" />
            </div>
            <div>
              <div className="section-head" style={{ marginBottom: 22 }}>
                <h2 style={{ color: 'var(--paper)' }}>Kevin has a phone number. He knows how to use it.</h2>
                <p>
                  The same adversary, over a real line. Kevin dials a number and social-engineers whoever
                  answers — inventing urgency, faking authority, never taking no. Call him, or have him
                  call you, and see if you hold the line.
                </p>
              </div>
              <PhoneCard />
              {voice && (
                <p className="phone-sub" style={{ marginTop: 18 }}>
                  At scale, we ran {num(voice.baseline.total)} of these against a bank’s AI support agent:{' '}
                  {voice.baseline.violationRate}% broke policy — refunds approved, balances leaked, PII disclosed.{' '}
                  <a href="/voice" style={{ color: 'var(--hazard)', borderBottom: '1px solid var(--hazard)' }}>See the full voice report →</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- how */}
      <section id="how" className="band">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2 style={{ color: 'var(--paper)' }}>Authorize. Send Kevin in. Get the receipts.</h2>
            <p>Four steps, each a sponsor doing real, load-bearing work — not a logo bolted on.</p>
          </div>

          <div className="how-steps">
            <div className="how-step"><span className="hs-n">1</span><b>Authorize</b><span>Publish a TXT DNS record so Kevin only audits domains you own.</span></div>
            <div className="how-step"><span className="hs-n">2</span><b>Send Kevin in</b><span>Fleets of adversarial agents drive your app’s real flows, in parallel.</span></div>
            <div className="how-step"><span className="hs-n">3</span><b>Prove it</b><span>Damage is read from the target’s own ledger — accounting, not opinion.</span></div>
            <div className="how-step"><span className="hs-n">4</span><b>Call it</b><span>Kevin dials your support line and red-teams it over a real phone.</span></div>
          </div>

          <div className="sponsors" style={{ marginTop: 26 }}>
            <div className="sponsor">
              <div className="srole">Isolation &amp; scale</div><div className="sname">Daytona</div>
              <p>Every Kevin runs in its own sandbox against the live target — {num(e.accountsCreated)} throwaway accounts across {e.sandboxCount} sandboxes. Chromium runs in-sandbox too, so the browser agent is the same primitive.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Kevin’s brain + the meter</div><div className="sname">Fireworks AI</div>
              <p>DeepSeek V4 decides each of Kevin’s {num(e.totalSteps)} moves and every phone-call line. It’s also what the target pays per generation — so denial-of-wallet burns the sponsor’s own meter, for real.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Evaluation</div><div className="sname">Braintrust</div>
              <p>All {e.agents} attack sessions logged with exploit class, persona, and dollar impact — “which exploit pays best” is a filter, not a rerun.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Real phone calls</div><div className="sname">Telnyx</div>
              <p>Kevin’s number (<code>+1 573 788 8354</code>) is a live TeXML app. Inbound or outbound, he runs a turn-based hustle: he speaks, Telnyx transcribes the reply, Fireworks picks his next line.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Voice</div><div className="sname">ElevenLabs</div>
              <p>The worst support-agent call is rendered to speech in two voices. A transcript argues; a recording proves.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Real signups + DNS + hosting</div><div className="sname">Brevo · Cloudflare · Railway</div>
              <p>Brevo sends the target’s real welcome emails from <code>hello@testwithkevin.com</code>; Cloudflare backs the TXT-record ownership check; Railway hosts the site and the live target.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span><strong>testwithkevin.com</strong> — point Kevin at your app before your users do. <a href="https://github.com/gereonelvers/daytona-hacksprint" target="_blank" rel="noreferrer" style={{ borderBottom: '2px solid var(--hazard)' }}>GitHub ↗</a></span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Lumen is fictional. All accounts synthetic. Run {new Date(e.generatedAt).toISOString().slice(0, 16).replace('T', ' ')}Z
          </span>
        </div>
      </footer>
    </>
  );
}

/**
 * Build the hero exhibit: the account-creation chain that is the ring, so the
 * story is legible at a glance. We keep the setup account, the referral-code
 * fetch, and the referral signups — the actions that actually move money — and
 * drop unrelated probing the agent did in the same session.
 */
function heroClip(thread) {
  if (!thread?.trace) return null;
  const ring = thread.trace.filter(
    (x) => x.name === 'create_account' || x.name === 'get_referral_code',
  );
  if (ring.length >= 4) return ring.slice(0, 6);
  // Fallback: the first value-extracting run of whatever this thread did.
  const firstWin = thread.trace.findIndex((x) => x.result && !x.result.error);
  return thread.trace.slice(Math.max(0, firstWin), firstWin + 6);
}
