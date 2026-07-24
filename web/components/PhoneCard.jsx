'use client';

import { useState } from 'react';

const NUMBER = '+1 573 788 8354';

/**
 * Kevin's phone. Two ways to hear him:
 *  - dial his number and he picks up in character (great for a live room), or
 *  - hand him a number and he calls it, running the turn-based hustle over a
 *    real Telnyx line.
 */
export function PhoneCard() {
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function callMe(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/telnyx/call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to }) });
      const data = await res.json();
      if (data.error) setMsg({ type: 'err', text: data.error });
      else setMsg({ type: 'ok', text: `Kevin is dialing ${data.to}. Pick up — and don't give him anything.` });
    } catch (err) {
      setMsg({ type: 'err', text: String(err.message) });
    }
    setBusy(false);
  }

  return (
    <div className="phone-card">
      <div className="phone-dial">
        <div className="phone-num-label">Call Kevin, live</div>
        <a className="phone-num mono" href={`tel:${NUMBER.replace(/\s/g, '')}`}>{NUMBER}</a>
        <div className="phone-sub">He picks up in character and tries to talk his way past you.</div>
      </div>
      <div className="phone-or">or</div>
      <form className="phone-callme" onSubmit={callMe}>
        <div className="phone-num-label">Have Kevin call you</div>
        <div className="phone-row">
          <input className="mono" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1 555 123 4567" inputMode="tel" />
          <button className="btn btn-primary" type="submit" disabled={busy || to.length < 7}>{busy ? 'Dialing…' : 'Ring me'}</button>
        </div>
        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
        <div className="phone-sub">Real outbound call over Telnyx. Answer as a support agent and see if you hold the line.</div>
      </form>
    </div>
  );
}
