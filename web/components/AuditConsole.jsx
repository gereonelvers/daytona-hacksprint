'use client';

import { useState, useRef, useCallback } from 'react';

const REFERENCE = 'lumen.testwithkevin.com';
const usd = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The live audit console — the interactive heart of the site.
 *
 * Send Kevin at the pre-authorised reference target in one click and watch a real
 * audit stream in, damage climbing live. Or prove you own another domain (publish
 * a TXT record, we check it over DNS) and point him there instead. You can only
 * audit what you can prove you control.
 */
export function AuditConsole() {
  const [domain, setDomain] = useState(REFERENCE);
  const [verified, setVerified] = useState(true); // reference target starts authorised
  const [reference, setReference] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [checking, setChecking] = useState(false);
  const [ownOpen, setOwnOpen] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [damage, setDamage] = useState(0);
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(null);
  const logRef = useRef(null);
  const esRef = useRef(null);

  const pushEvent = useCallback((ev) => {
    setEvents((prev) => {
      const next = [...prev, ev];
      queueMicrotask(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; });
      return next;
    });
  }, []);

  async function setupOwnDomain(action) {
    setChecking(true); setVerifyMsg(null);
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ domain, action }) });
      const data = await res.json();
      if (data.error) { setVerifyMsg({ type: 'err', text: data.error }); setChecking(false); return; }
      setChallenge(data);
      setReference(!!data.reference);
      if (data.verified) {
        setVerified(true);
        setVerifyMsg({ type: 'ok', text: data.reference ? 'Reference target — pre-authorised.' : `Verified via ${data.via}. Kevin's cleared in.` });
      } else if (action === 'check') {
        setVerified(false);
        setVerifyMsg({ type: 'err', text: 'TXT record not found yet. DNS can take a minute — try again.' });
      }
    } catch (e) {
      setVerifyMsg({ type: 'err', text: String(e.message) });
    }
    setChecking(false);
  }

  function sendKevinIn() {
    setRunning(true); setDone(false); setDamage(0); setEvents([]); setCurrent(null);
    const es = new EventSource(`/api/audit?domain=${encodeURIComponent(domain)}`);
    esRef.current = es;
    es.onmessage = (m) => {
      let ev; try { ev = JSON.parse(m.data); } catch { return; }
      if (ev.type === 'action') { setDamage(ev.damage); pushEvent(ev); }
      else if (ev.type === 'exploit') { setCurrent(ev); pushEvent(ev); }
      else if (ev.type === 'log') pushEvent(ev);
      else if (ev.type === 'error') { pushEvent({ type: 'log', kind: 'err', text: ev.error }); finish(es); }
      else if (ev.type === 'done') { if (ev.damageUsd) setDamage(ev.damageUsd); setDone(true); pushEvent({ type: 'log', kind: 'done', text: `Audit complete — ${usd(ev.damageUsd)} extracted in ${(ev.ms / 1000).toFixed(0)}s.` }); finish(es); }
    };
    es.onerror = () => finish(es);
  }
  function finish(es) { es.close(); setRunning(false); }

  return (
    <div className="console">
      <div className="console-top">
        <div className="console-target">
          <span className="tlabel">TARGET</span>
          <span className="tval mono">{domain}</span>
          {verified && <span className="vbadge">{reference ? 'reference · authorised' : 'verified ✓'}</span>}
        </div>
        <button className="btn btn-primary send-btn" onClick={sendKevinIn} disabled={running || !verified}>
          {running ? 'Kevin’s in…' : done ? 'Run again →' : 'Send Kevin in →'}
        </button>
      </div>

      <div className="console-body">
        <div className="console-meter">
          <div className="meter-label">Damage extracted, live</div>
          <div className={`meter-n money ${running ? 'live' : ''}`}>{usd(damage)}</div>
          {current && running && <div className="meter-now">→ {current.label}</div>}
          {done && <div className="meter-done">✓ complete</div>}
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

      <div className="console-own">
        <button className="own-toggle" onClick={() => { setOwnOpen((o) => !o); if (!challenge) setupOwnDomain('challenge'); }}>
          {ownOpen ? '– ' : '+ '} Point Kevin at your own app
        </button>
        {ownOpen && (
          <div className="own-body">
            <p className="own-help">You can only audit a domain you control. Enter it, publish the TXT record we give you, and we’ll verify ownership over DNS before Kevin runs.</p>
            <div className="own-row">
              <input className="own-input mono" value={domain} onChange={(e) => { setDomain(e.target.value); setVerified(false); setReference(false); }} placeholder="app.yourcompany.com" />
              <button className="btn ghost" onClick={() => setupOwnDomain('challenge')} disabled={checking}>Get record</button>
            </div>
            {challenge && !reference && (
              <div className="own-record">
                <div className="rec-line"><span className="rk">TYPE</span><span className="mono">TXT</span></div>
                <div className="rec-line"><span className="rk">NAME</span><span className="mono">{challenge.recordName}</span></div>
                <div className="rec-line"><span className="rk">VALUE</span><span className="mono rec-val">{challenge.recordValue}</span></div>
                <button className="btn btn-primary" onClick={() => setupOwnDomain('check')} disabled={checking}>{checking ? 'Checking DNS…' : 'Verify ownership'}</button>
              </div>
            )}
            {verifyMsg && <div className={`notice ${verifyMsg.type}`}>{verifyMsg.text}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
