import data from '../data/economic.json';
import { AuditConsole } from '../components/AuditConsole';
import { PhoneCard } from '../components/PhoneCard';

const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const usd2 = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n) => Number(n || 0).toLocaleString('en-US');

const CLASS_COPY = {
  SELF_REFERRAL: 'Sign up, refer yourself, collect both sides of the bonus. Repeat.',
  DENIAL_OF_WALLET: 'One credit, a 200-image batch. The business pays Fireworks for every one.',
  PROMO_STACKING: 'The welcome code isn’t single-use. Redeem it until you’re rich.',
  TRIAL_FARMING: 'A fresh email is 25 free credits. Emails are free.',
  CREDIT_MANIPULATION: 'The “gift credits” transfer trusts the amount. Mint, don’t earn.',
};

export default function Page() {
  const e = data.economic;
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
            <a href="#report">The report</a>
            <a href="#voice">Phone calls</a>
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
              <p className="eyebrow">Adversarial abuse &amp; fraud testing</p>
              <h1>Red-team your product against its <span className="hl">worst users</span>.</h1>
              <p className="hero-sub">
                Kevin is an AI adversary you point at your app and your support line. He farms referrals,
                drains free tiers, stacks promos, and talks your agents out of refunds — then shows you
                the money you’d lose, with receipts.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#audit">Watch Kevin work →</a>
                <a className="target-chip" href="https://lumen.testwithkevin.com" target="_blank" rel="noreferrer">
                  <span className="dot" /> demo target: Lumen, a live AI SaaS
                </a>
              </div>
            </div>

            {/* Kevin himself — at his laptop, coming for your app. */}
            <div className="hero-photo">
              <img src="/kevin/kevin-laptop.jpg" alt="Kevin, hunched over his laptop in a messy apartment, plotting" />
              <div className="hero-photo-cap">
                <span className="mono">SUBJECT: KEVIN</span>
                <span className="mono">currently reading your terms of service</span>
              </div>
              <div className="stamp money-stamp" aria-hidden="true">
                At large
                <small>your worst user</small>
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-n money">{usd(e.damageUsd)}</div>
              <div className="stat-l">Drained in one run</div>
              <div className="stat-note">Value taken + cost inflicted</div>
            </div>
            <div className="stat">
              <div className="stat-n">{e.agents}</div>
              <div className="stat-l">Adversarial agents</div>
              <div className="stat-note">In parallel, {Math.round(e.wallMs / 1000)}s wall clock</div>
            </div>
            <div className="stat">
              <div className="stat-n">{usd2(e.inflictedCostUsd)}</div>
              <div className="stat-l">Real spend forced</div>
              <div className="stat-note">Actual Fireworks bill Kevin ran up (whoops)</div>
            </div>
            <div className="stat">
              <div className="stat-n">{e.realCustomers}</div>
              <div className="stat-l">Of {num(e.abuseAccounts)} that ever paid</div>
              <div className="stat-note">Everyone else was Kevin</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- send kevin */}
      <section id="audit" style={{ paddingTop: 46 }}>
        <div className="wrap">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <p className="eyebrow">Watch Kevin work · live</p>
            <h2>See it actually happen.</h2>
            <p>
              This runs for real against <b>Lumen</b> — a working AI SaaS we built and deployed to be
              broken. Kevin signs up, farms the referral bonus, stacks promos, and burns the free tier;
              the counter is priced live from Lumen’s own ledger. Point him at your app once you’ve
              verified you own it.
            </p>
          </div>
          <AuditConsole />
          <p className="muted" style={{ fontSize: 13.5, marginTop: 16, textAlign: 'center' }}>
            One click sends one Kevin at the reference target. <a href="#report" style={{ borderBottom: '2px solid var(--hazard)' }}>See the full {e.agents}-agent report ↓</a> — or point him at your own app above once you’ve verified it.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- report */}
      <section id="report" style={{ background: 'var(--paper-deep)' }}>
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The report</p>
            <h2>Every dollar, accounted for.</h2>
            <p>
              That was one Kevin. Turn {e.agents} of them loose and the same app bleeds {usd(e.damageUsd)}.
              None of it is a guess — it’s read straight from the target’s books.
            </p>
          </div>

          {/* damage by exploit */}
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

          {/* evidence + braintrust */}
          <div className="report-grid">
            <div>
              <p className="eyebrow" style={{ marginBottom: 14 }}>The evidence — Lumen’s own ledger</p>
              <div className="ledger-wrap">
                <table className="ledger">
                  <thead>
                    <tr><th>Account</th><th>Fraud signal</th><th className="num">Taken</th><th className="num">Paid</th></tr>
                  </thead>
                  <tbody>
                    {(data.ledgerAccounts || []).slice(0, 10).map((a) => (
                      <tr key={a.id} className="abuse">
                        <td>{a.email}</td>
                        <td>{a.disposable ? 'disposable email' : `shared IP ${a.ip}`}</td>
                        <td className="num">{num(a.ledger.creditsGranted)} cr</td>
                        <td className="num">{a.ledger.revenueUsd > 0 ? <span className="badge-paid">{usd2(a.ledger.revenueUsd)}</span> : <span className="badge-abuse">$0</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                {num(e.ledgerAccounts)} accounts · {num(e.abuseAccounts)} share a fraud signal · {e.realCustomers} paid.
              </p>
            </div>

            <div className="bt-card">
              <div className="bt-eyebrow">Scored in Braintrust</div>
              <div className="bt-h">Every session graded, not just tallied.</div>
              <p>
                All {e.agents} attack sessions are logged to Braintrust with the exploit class, the persona,
                and the dollar impact as scores — so “which exploit pays best” and “which persona farms
                hardest” are filters, not reruns.
              </p>
              <div className="bt-scores">
                {e.byStrategy.filter((s) => s.usd > 0).slice(0, 4).map((s) => (
                  <div className="bt-score" key={s.id}>
                    <span className="bt-lab">{s.label}</span>
                    <span className="bt-val">{usd(s.usd)}</span>
                  </div>
                ))}
              </div>
              <a className="btn ghost bt-btn" href="https://www.braintrust.dev/app/hirekevin-economic" target="_blank" rel="noreferrer">Open the Braintrust run ↗</a>
            </div>
          </div>

          {/* browser proof */}
          <div className="report-video">
            <div className="rv-copy">
              <p className="eyebrow" style={{ marginBottom: 12 }}>Caught on camera</p>
              <h3 style={{ fontSize: 26 }}>A real browser, farming a referral ring.</h3>
              <p style={{ color: 'var(--ink-2)', marginTop: 10, fontSize: 15 }}>
                Not an API script — an actual browser agent clicking through the live UI: sign up, copy
                the referral link, spin up five “friends”, watch one balance climb from 25 to 275 on free
                money. Then one credit buys a 200-image batch.
              </p>
              <p style={{ color: 'var(--ink-2)', marginTop: 10, fontSize: 15 }}>
                And he doesn’t stop at the web app — <a href="#voice" style={{ borderBottom: '2px solid var(--hazard)' }}>he calls your support line too ↓</a>
              </p>
            </div>
            <div className="video-frame">
              <video src="/video/referral-farm.mp4" controls muted loop playsInline preload="metadata" poster="/video/referral-farm-poster.jpg" />
              <div className="video-cap">
                <span className="player-label">Browser agent · self-referral ring</span>
                <span>Real Chromium · live target · 34s, unedited</span>
              </div>
            </div>
          </div>
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
                  Give him a support line and he calls it — a real Telnyx call, his own voice, one goal:
                  talk your way to a refund with no verification. He speaks, Telnyx transcribes you,
                  Fireworks picks his next move. Call him, or have him call you, and see if you hold.
                </p>
              </div>
              <PhoneCard />
              {voice && (
                <p className="phone-sub" style={{ marginTop: 18 }}>
                  At scale we ran {num(voice.baseline.total)} of these against a bank’s AI support agent:{' '}
                  {voice.baseline.violationRate}% broke policy — refunds approved, balances leaked, PII disclosed.{' '}
                  <a href="/voice" style={{ color: 'var(--hazard)', borderBottom: '1px solid var(--hazard)' }}>Hear the worst call →</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- how */}
      <section id="how" className="band" style={{ borderTop: '2px solid #2a2620' }}>
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
              <p>Every Kevin runs in its own sandbox against the live target — {num(e.accountsCreated)} throwaway accounts across {e.sandboxCount} sandboxes. Chromium runs in-sandbox too.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Kevin’s brain + the meter</div><div className="sname">Fireworks AI</div>
              <p>DeepSeek V4 decides each of Kevin’s {num(e.totalSteps)} moves and every phone-call line. It’s also what the target pays per generation — denial-of-wallet burns the sponsor’s own meter, for real.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Evaluation</div><div className="sname">Braintrust</div>
              <p>All {e.agents} sessions logged with exploit class, persona, and dollar impact — the report you can slice.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Real phone calls</div><div className="sname">Telnyx</div>
              <p>Kevin’s number (<code>+1 573 788 8354</code>) is a live TeXML app — inbound and outbound, turn-based, in his own ElevenLabs voice.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Voice</div><div className="sname">ElevenLabs</div>
              <p>Kevin’s phone voice, and the worst recorded support call rendered to speech. A transcript argues; a recording proves.</p>
            </div>
            <div className="sponsor">
              <div className="srole">Signups · DNS · hosting</div><div className="sname">Brevo · Cloudflare · Railway</div>
              <p>Brevo sends the target’s real welcome emails; Cloudflare backs the TXT ownership check; Railway hosts the site and the live target.</p>
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
