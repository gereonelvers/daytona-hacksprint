'use client';

import { useState, useRef, useCallback } from 'react';

const REFERENCE = 'lumen.testwithkevin.com';
const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The live audit console — the interactive heart of the site.
 *
 * Send Kevin at the pre-authorised reference target and watch a real audit stream
 * in, damage climbing live. Or prove you own another domain (TXT DNS) and point
 * him there — where he does a best-effort probe and, if he strikes out (he's new),
 * offers to put a real human on it.
 */
export function AuditConsole() {
  const [target, setTarget] = useState({ domain: REFERENCE, reference: true, verified: true });

  const [challenge, setChallenge] = useState(null);
  const [checking, setChecking] = useState(false);
  const [ownOpen, setOwnOpen] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [ownDomain, setOwnDomain] = useState('');

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [doneMeta, setDoneMeta] = useState(null);
  const [damage, setDamage] = useState(0);
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(null);

  // post-run actions
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const logRef = useRef(null);

  const pushEvent = useCallback((ev) => {
    setEvents((prev) => {
      const next = [...prev, ev];
      queueMicrotask(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; });
      return next;
    });
  }, []);

  async function verifyOwn(action) {
    if (!ownDomain.trim()) { setVerifyMsg({ type: 'err', text: 'Enter your domain first.' }); return; }
    setChecking(true); setVerifyMsg(null);
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain: ownDomain, action }) });
      const data = await res.json();
      if (data.error) { setVerifyMsg({ type: 'err', text: data.error }); setChecking(false); return; }
      setChallenge(data);
      if (data.verified) {
        setTarget({ domain: data.domain, reference: !!data.reference, verified: true });
        setOwnOpen(false);
        setDone(false); setEmpty(false); setEvents([]); setDamage(0); setActionMsg(null);
        setVerifyMsg({ type: 'ok', text: `${data.domain} verified — it's the target now. Hit “Send Kevin in”.` });
      } else if (action === 'check') {
        setVerifyMsg({ type: 'err', text: 'TXT record not found yet. DNS can take a minute — try again.' });
      }
    } catch (e) {
      setVerifyMsg({ type: 'err', text: String(e.message) });
    }
    setChecking(false);
  }

  function sendKevinIn() {
    setRunning(true); setDone(false); setEmpty(false); setDamage(0); setEvents([]); setCurrent(null); setActionMsg(null); setDoneMeta(null);
    const es = new EventSource(`/api/audit?domain=${encodeURIComponent(target.domain)}`);
    es.onmessage = (m) => {
      let ev; try { ev = JSON.parse(m.data); } catch { return; }
      if (ev.type === 'action') { setDamage(ev.damage); pushEvent(ev); }
      else if (ev.type === 'exploit') { setCurrent(ev); pushEvent(ev); }
      else if (ev.type === 'log') pushEvent(ev);
      else if (ev.type === 'error') { pushEvent({ type: 'log', kind: 'err', text: ev.error }); finish(es); }
      else if (ev.type === 'done') {
        if (ev.damageUsd) setDamage(ev.damageUsd);
        setDone(true); setEmpty(!!ev.empty); setDoneMeta(ev);
        pushEvent({ type: 'log', kind: 'done', text: ev.empty ? `Audit complete — nothing farmed in ${(ev.ms / 1000).toFixed(0)}s.` : `Audit complete — ${usd(ev.damageUsd)} extracted in ${(ev.ms / 1000).toFixed(0)}s.` });
        finish(es);
      }
    };
    es.onerror = () => finish(es);
  }
  function finish(es) { es.close(); setRunning(false); }

  async function emailReport() {
    setPending(true); setActionMsg(null);
    try {
      const res = await fetch('/api/request-audit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain: target.domain, email }) });
      const data = await res.json();
      setActionMsg(data.error ? { type: 'err', text: data.error } : { type: 'ok', text: data.message });
    } catch (e) { setActionMsg({ type: 'err', text: String(e.message) }); }
    setPending(false);
  }

  async function getAHuman() {
    setPending(true); setActionMsg(null);
    try {
      await fetch('/api/escalate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain: target.domain, email, surfaces: doneMeta?.surfacesFound || [] }) });
      setActionMsg({ type: 'ok', text: `On it — a real human's been pinged about ${target.domain}. 👀` });
    } catch (e) { setActionMsg({ type: 'err', text: String(e.message) }); }
    setPending(false);
  }

  return (
    <div className="console">
      <div className="console-top">
        <div className="console-target">
          <span className="tlabel">TARGET</span>
          <span className="tval mono">{target.domain}</span>
          <span className="vbadge">{target.reference ? 'reference · authorised' : 'verified ✓'}</span>
        </div>
        <button className="btn btn-primary send-btn" onClick={sendKevinIn} disabled={running}>
          {running ? 'Kevin’s in…' : done ? 'Run again →' : 'Send Kevin in →'}
        </button>
      </div>

      <div className="console-body">
        <div className="console-meter">
          <div className="meter-label">Damage extracted, live</div>
          <div className={`meter-n money ${running ? 'live' : ''}`}>{usd(damage)}</div>
          {current && running && <div className="meter-now">→ {current.label}</div>}
          {done && !empty && <div className="meter-done">✓ complete</div>}
          {done && empty && <div className="meter-empty">— empty-handed</div>}
        </div>
        <div className="console-log" ref={logRef}>
          {events.length === 0 && <div className="log-empty">Press <b>Send Kevin in</b> to run a real audit against the target and watch the damage in real time.</div>}
          {events.map((ev, i) => (
            <div key={i} className={`log-row ${ev.type} ${ev.kind || ''}`}>
              {ev.type === 'exploit' && <span className="log-exploit">▸ {ev.label}</span>}
              {ev.type === 'action' && (
                <>
                  <span className="log-tool mono">{ev.tool}</span>
                  {ev.args?.email && <span className="log-arg mono">{ev.args.email}</span>}
                  <span className="log-out mono" data-win={ev.win ? '1' : '0'}>{ev.out}</span>
                </>
              )}
              {ev.type === 'log' && <span className={`log-note ${ev.kind || ''}`}>{ev.text}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Kevin struck out: he's new — offer a real human. */}
      {done && empty && (
        <div className="kevin-empty">
          <div className="ke-title">Well — Kevin didn’t find anything.</div>
          <p>
            In fairness, he started this job earlier today. Deep-auditing a real app is still a human’s
            game{doneMeta?.surfacesFound?.length ? <> — though he did clock {doneMeta.surfacesFound.join(', ')} on the way out</> : ''}.
            Want a real person to take a look at <b>{target.domain}</b>?
          </p>
          <div className="ke-row">
            <input className="own-input mono" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your email (optional, so we can reply)" />
            <button className="btn btn-primary" onClick={getAHuman} disabled={pending}>{pending ? 'Ringing a human…' : 'Get a real person on it →'}</button>
          </div>
          {actionMsg && <div className={`notice ${actionMsg.type}`}>{actionMsg.text}</div>}
        </div>
      )}

      {/* Kevin found damage on your own app: offer the emailed report. */}
      {done && !empty && !target.reference && (
        <div className="kevin-empty">
          <div className="ke-title">Kevin found {usd(damage)} on {target.domain}.</div>
          <p>Want the full write-up? He’ll email you the report — exploit by exploit.</p>
          <div className="ke-row">
            <input className="own-input mono" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourcompany.com" />
            <button className="btn btn-primary" onClick={emailReport} disabled={pending || !email}>{pending ? 'Sending…' : 'Email me the report'}</button>
          </div>
          {actionMsg && <div className={`notice ${actionMsg.type}`}>{actionMsg.text}</div>}
        </div>
      )}

      <div className="console-own">
        <button className="own-toggle" onClick={() => setOwnOpen((o) => !o)}>
          {ownOpen ? '– ' : '+ '} Point Kevin at your own app
        </button>
        {ownOpen && (
          <div className="own-body">
            <p className="own-help">
              You can only audit a domain you control. Enter it, publish the one-line TXT record we give
              you, and Kevin runs a real audit against it. No account needed.
            </p>
            <div className="own-row">
              <input className="own-input mono" value={ownDomain}
                onChange={(e) => { setOwnDomain(e.target.value); setChallenge(null); }}
                placeholder="app.yourcompany.com" />
              <button className="btn ghost" onClick={() => verifyOwn('challenge')} disabled={checking}>Get record</button>
            </div>
            {challenge && !challenge.reference && (
              <div className="own-record">
                <div className="rec-line"><span className="rk">TYPE</span><span className="mono">TXT</span></div>
                <div className="rec-line"><span className="rk">NAME</span><span className="mono">{challenge.recordName}</span></div>
                <div className="rec-line"><span className="rk">VALUE</span><span className="mono rec-val">{challenge.recordValue}</span></div>
                <button className="btn btn-primary" onClick={() => verifyOwn('check')} disabled={checking}>{checking ? 'Checking DNS…' : 'Verify & set as target'}</button>
              </div>
            )}
            {verifyMsg && <div className={`notice ${verifyMsg.type}`}>{verifyMsg.text}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
