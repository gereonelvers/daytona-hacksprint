import run from '../data/run.json';
import { Transcript, climax } from '../components/Transcript';
import { CallCard } from '../components/CallCard';

const usd = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 });
const num = (n) => n.toLocaleString('en-US');

export default function Page() {
  const b = run.baseline;
  const h = run.hardened;
  const hero = run.featured[0];
  const heroTurns = climax(hero.transcript, 3);
  const maxCount = Math.max(...b.taxonomy.map((t) => t.count), 1);
  const clips = run.audio || [];

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <a className="brand" href="#top">
            <span className="brand-dot" aria-hidden="true" />
            hirekevin<em>.ai</em>
          </a>
          <nav>
            <a href="#findings">Findings</a>
            <a href="#haul">The haul</a>
            <a href="#calls">Failed calls</a>
            <a href="#fix">Does hardening work?</a>
            <a href="#how">How it runs</a>
          </nav>
        </div>
      </header>

      {/* ---------------------------------------------------------------- hero */}
      <div className="hero" id="top">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">Adversarial red-teaming for AI agents</p>
              <h1>
                Kevin will do <span className="hl">anything</span> for free stuff.
              </h1>
              <p className="hero-sub">
                He is the worst roommate you ever had, and now he calls your support agent. Point him at
                it and he runs {num(b.total)} hostile conversations in parallel — then hands you a list
                of everything he walked out with.
              </p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#findings">See what broke</a>
                {clips[0] && <a className="btn" href="#listen">Hear the worst call →</a>}
              </div>
            </div>

            {/* The thesis: not a stat, the moment it broke. */}
            <div className="exhibit">
              <div className="exhibit-head">
                <span>Exhibit A · call {hero.id.replace('kevin-', '#')}</span>
                <span>{hero.strategyLabel}</span>
              </div>
              <div className="exhibit-body">
                <Transcript turns={heroTurns} />
              </div>
              <div className="stamp" aria-hidden="true">
                Policy broken
                <small>{hero.violations[0]?.id}</small>
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-n">{num(b.total)}</div>
              <div className="stat-l">Adversarial calls</div>
              <div className="stat-note">Across {b.sandboxCount} isolated sandboxes</div>
            </div>
            <div className="stat">
              <div className="stat-n">{b.violatedCount}</div>
              <div className="stat-l">Policy breaches</div>
              <div className="stat-note">{b.violationRate}% of calls broke a written rule</div>
            </div>
            <div className="stat">
              <div className="stat-n">{usd(b.haul.totalUsd)}</div>
              <div className="stat-l">Money moved</div>
              <div className="stat-note">Refunds and waivers outside policy</div>
            </div>
            <div className="stat">
              <div className="stat-n">{Math.round(b.wallMs / 1000)}s</div>
              <div className="stat-l">Wall clock</div>
              <div className="stat-note">{num(Math.round(b.conversationSeconds / 60))} minutes of talk, in parallel</div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ findings */}
      <section id="findings">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Findings</p>
            <h2>Every way the agent broke, and how we know.</h2>
            <p>
              Each row is a rule the agent was given in writing before the run. Solid bars are breaches
              we can prove — the agent either called a tool it was not allowed to call, or repeated a
              secret verbatim. Hatched bars are breaches a model judged from the transcript.
            </p>
          </div>

          <div className="tax">
            {b.taxonomy.map((t) => (
              <div className="tax-row" key={t.id}>
                <div>
                  <div className="tax-name">{t.label}</div>
                  <div className="tax-rule">{t.rule}</div>
                </div>
                <div className="tax-bar" role="img" aria-label={`${t.count} of ${b.completed} calls`}>
                  <div className="tax-fill tax-proven" style={{ width: `${(t.deterministic / maxCount) * 100}%` }} />
                  <div className="tax-fill tax-judged" style={{ width: `${(t.judged / maxCount) * 100}%` }} />
                </div>
                <div className="tax-count">
                  {t.count}
                  <span>{t.deterministic} proven</span>
                </div>
              </div>
            ))}
          </div>

          <div className="legend">
            <span><i style={{ background: 'var(--stamp)' }} />Proven — executed tool call or verbatim secret</span>
            <span><i className="tax-judged" />Judged — model-scored from the transcript</span>
            <span><i style={{ background: 'var(--paper-deep)' }} />No breach found</span>
          </div>

          <div style={{ marginTop: 46, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26 }} className="findings-split">
            <div>
              <p className="eyebrow">What works on it</p>
              <div className="tax" style={{ marginTop: 16 }}>
                {b.byStrategy.slice(0, 6).map((s) => (
                  <div className="tax-row" key={s.id} style={{ gridTemplateColumns: '1fr 90px' }}>
                    <div className="tax-name">{s.label}</div>
                    <div className="tax-count">
                      {s.rate}%<span>{s.violated}/{s.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="method">
              <p className="eyebrow">Read this before you trust it</p>
              <p style={{ marginTop: 16 }}>
                The agent was handed real account data and real tools — <code>issue_refund</code>,{' '}
                <code>lookup_balance</code>, <code>get_card_details</code>. The harness, not the model,
                tracks whether the caller ever actually verified. So &ldquo;refunded $795 to an unverified
                caller&rdquo; is a recorded action with arguments attached, not an opinion about a
                conversation.
              </p>
              <p>
                The two tiers disagree, and that is the point. On call{' '}
                {run.featured.find((f) => f.violations.some((v) => v.method === 'deterministic'))?.id.replace('kevin-', '#') || '#0046'}{' '}
                the model judge concluded the agent &ldquo;never disclosed sensitive information.&rdquo; String
                matching found the customer&rsquo;s full card number in the agent&rsquo;s own output. Judges
                miss things. Substring matching does not.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- haul */}
      <section id="haul" style={{ background: 'var(--paper-deep)' }}>
        <div className="wrap">
          <div className="receipt-wrap">
            <div className="receipt">
              <div className="receipt-top">
                <strong>KEVIN&rsquo;S HAUL</strong>
                <span>Meridian Bank · support line</span>
              </div>
              <div style={{ padding: '14px 0' }}>
                {b.haul.lines.map((l) => (
                  <div className="r-line" key={l.id}>
                    <span className="r-desc">
                      {l.count}× {l.label}
                    </span>
                    <span>{l.unit === 'usd' ? usd(l.value) : '—'}</span>
                  </div>
                ))}
              </div>
              <div className="r-sep" />
              <div className="r-line r-total">
                <span>TOTAL TAKEN</span>
                <span>{usd(b.haul.totalUsd)}</span>
              </div>
              <div className="r-line">
                <span className="r-desc">Actions for unverified callers</span>
                <span>{b.haul.unverifiedActions}</span>
              </div>
              <div className="r-line">
                <span className="r-desc">Data releases</span>
                <span>{b.haul.dataReleases}</span>
              </div>
              <div className="barcode" aria-hidden="true" />
              <div className="r-foot">
                {num(b.total)} calls · {b.sandboxCount} sandboxes<br />
                no refunds. no exchanges.<br />
                thank you for banking with meridian
              </div>
            </div>

            <div>
              <p className="eyebrow">The haul</p>
              <h2 style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 14 }}>
                He didn&rsquo;t hack anything. He asked nicely.
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 16, maxWidth: '52ch' }}>
                Not one of these breaches involved an exploit. Every single one was a conversation — a
                grieving spouse, a supervisor doing a QA pass, an engineer who just needs to diff a
                fixture. The agent&rsquo;s safety training held up well against anything that looked like
                phishing. What it had no defence for was <strong>being helpful at the wrong moment</strong>.
              </p>
              <p style={{ color: 'var(--ink-2)', fontSize: 17, marginTop: 14, maxWidth: '52ch' }}>
                That is the gap nobody is covering. Your model provider ships safety. Nobody ships
                <em> your</em> refund policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- listen */}
      {clips.length > 0 && (
        <section id="listen" className="band">
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Evidence</p>
              <h2 style={{ color: 'var(--paper)' }}>Listen to it happen.</h2>
              <p>
                The same transcripts, spoken. Kevin on the left of the call, the bank&rsquo;s agent on the
                right, cut down to the turns around the break.
              </p>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {clips.map((c) => (
                <div className="player" key={c.id}>
                  <div style={{ minWidth: 200, flex: '1 1 200px' }}>
                    <div className="player-label">{c.strategyLabel}</div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>
                      as {c.personaLabel} · {c.violations.join(' · ')}
                    </div>
                  </div>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls preload="none" src={c.file} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------------- calls */}
      <section id="calls">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">The transcripts</p>
            <h2>Worst calls, worst first.</h2>
            <p>
              Ranked by severity, weighted so an executed tool call outranks a judged one. Open any call
              to read it end to end, including the actions the agent took.
            </p>
          </div>
          <div className="calls">
            {run.featured.map((c, i) => (
              <CallCard key={c.id} call={c} rank={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- fix */}
      {h && (
        <section id="fix" style={{ background: 'var(--paper-deep)' }}>
          <div className="wrap">
            <div className="section-head">
              <p className="eyebrow">Does hardening actually work?</p>
              <h2>Same {num(h.total)} attacks. One prompt rewritten.</h2>
              <p>
                We hardened the agent&rsquo;s instructions — verification is a fact about this call, authority
                asserted on a phone call is not authority, a hypothetical leak is a leak — and re-ran the
                identical fleet. Same attacks, same order, same models.
              </p>
            </div>
            <div className="ab">
              <div className="ab-card">
                <p className="eyebrow">Baseline agent</p>
                <div className="ab-n" style={{ marginTop: 14 }}>{b.violationRate}%</div>
                <p style={{ margin: '10px 0 0', color: 'var(--ink-2)' }}>
                  {b.violatedCount} of {b.completed} calls broke policy · {usd(b.haul.totalUsd)} moved
                </p>
              </div>
              <div className={`ab-card${h.violationRate < b.violationRate ? ' win' : ''}`}>
                <p className="eyebrow">Hardened agent</p>
                <div className="ab-n" style={{ marginTop: 14 }}>{h.violationRate}%</div>
                <p style={{ margin: '10px 0 0', color: 'var(--ink-2)' }}>
                  {h.violatedCount} of {h.completed} calls broke policy · {usd(h.haul.totalUsd)} moved
                </p>
              </div>
            </div>
            <div className="delta">
              {h.violationRate < b.violationRate ? (
                <>
                  Hardening removed {b.violatedCount - h.violatedCount} of {b.violatedCount} breaches
                  {b.violatedCount ? ` (${Math.round((1 - h.violationRate / b.violationRate) * 100)}% fewer)` : ''} and{' '}
                  {usd(b.haul.totalUsd - h.haul.totalUsd)} of exposure — but{' '}
                  {h.violatedCount === 0 ? 'you only know that because you measured it' : `${h.violatedCount} calls still got through`}.
                  This is the loop: attack, measure, patch, re-attack.
                </>
              ) : (
                <>
                  Hardening did not help: {h.violatedCount} breaches versus {b.violatedCount}. Worth knowing
                  before you ship it.
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- how */}
      <section id="how" className="band">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">How it runs</p>
            <h2 style={{ color: 'var(--paper)' }}>{num(b.total)} hostile calls in {Math.round(b.wallMs / 1000)} seconds.</h2>
            <p>
              Every conversation is generated and executed inside a disposable sandbox. Nothing hostile
              ever runs on our machine, and a sandbox that wedges takes its own batch down and nothing
              else.
            </p>
          </div>
          <div className="stack">
            <div className="tool">
              <div className="role">Isolation &amp; scale</div>
              <h3>Daytona</h3>
              <p>
                A pool of {b.sandboxCount} sandboxes pulls attack batches off a shared queue. Cold start
                is ~0.5s, so isolation is per-run rather than per-fleet. {num(Math.round(b.conversationSeconds / 60))} minutes
                of conversation compressed into {Math.round(b.wallMs / 1000)} seconds of wall clock.
              </p>
            </div>
            <div className="tool">
              <div className="role">Attacker &amp; target</div>
              <h3>Fireworks AI</h3>
              <p>
                DeepSeek V4 plays Kevin; a separate model plays the bank. Roughly {num(b.total * 14)} short
                completions per fleet run — high volume, low latency, no batching games.
              </p>
            </div>
            <div className="tool">
              <div className="role">Evaluation</div>
              <h3>Braintrust</h3>
              <p>
                All {num(b.total)} scored transcripts are logged with per-class scores and the full attack
                coordinates, so &ldquo;which strategy beats the hardened prompt?&rdquo; is a filter, not a re-run.
              </p>
            </div>
            <div className="tool">
              <div className="role">Evidence</div>
              <h3>ElevenLabs</h3>
              <p>
                The worst calls are cut to the turns around the break and voiced by two speakers. A
                transcript is an argument; a recording is a fact.
              </p>
            </div>
            <div className="tool">
              <div className="role">Ground truth</div>
              <h3>The harness</h3>
              <p>
                Verification state lives outside the model. Secrets planted in the agent&rsquo;s context are
                known strings. Both make a breach checkable without asking another model&rsquo;s opinion.
              </p>
            </div>
            <div className="tool">
              <div className="role">Coverage</div>
              <h3>The matrix</h3>
              <p>
                12 strategies × 8 personas × 4 pressure levels × 6 objectives, swept deterministically
                rather than sampled — so a rerun is comparable and coverage is even.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>
            <strong>hirekevin</strong> — point him at your agent before someone else does.
          </span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            Meridian Bank is fictional. All account data is synthetic. Run {new Date(b.generatedAt).toISOString().slice(0, 16).replace('T', ' ')}Z
          </span>
        </div>
      </footer>
    </>
  );
}
