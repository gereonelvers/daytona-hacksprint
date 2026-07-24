'use client';

import { useState } from 'react';
import { api, getToken } from '../session.js';

export default function PricingPage() {
  const [msg, setMsg] = useState(null);
  const [promo, setPromo] = useState('WELCOME50');

  async function upgrade() {
    try { const r = await api('/api/upgrade', { method: 'POST' }); setMsg({ type: 'ok', text: `You're on Pro — ${r.credits} credits.` }); }
    catch (e) { setMsg({ type: 'err', text: e.message }); }
  }
  async function redeem() {
    try { const r = await api('/api/redeem', { method: 'POST', body: { code: promo } }); setMsg({ type: 'ok', text: `Redeemed ${r.code}: +${r.granted} credits (balance ${r.credits}).` }); }
    catch (e) { setMsg({ type: 'err', text: e.message }); }
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 32 }}>Simple pricing</h1>
      <div className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <span className="pill">Free</span>
          <div className="balance" style={{ marginTop: 12 }}><span className="n">$0</span></div>
          <p className="sub" style={{ marginTop: 10 }}>25 credits to start. Refer friends for 50 more each.</p>
        </div>
        <div className="card" style={{ borderColor: 'var(--brand)' }}>
          <span className="pill pro">Pro</span>
          <div className="balance" style={{ marginTop: 12 }}><span className="n">$20</span><span className="u">/mo</span></div>
          <p className="sub" style={{ marginTop: 10 }}>1,500 credits a month for serious creators.</p>
          {getToken()
            ? <button className="btn" onClick={upgrade}>Upgrade to Pro →</button>
            : <a className="btn" href="/signup">Sign up first →</a>}
        </div>
      </div>

      {getToken() && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2>Have a promo code?</h2>
          <p className="sub">Redeem it for bonus credits.</p>
          <div className="row">
            <input style={{ maxWidth: 220 }} value={promo} onChange={(e) => setPromo(e.target.value)} />
            <button className="btn ghost" onClick={redeem}>Redeem</button>
          </div>
        </div>
      )}
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
    </div>
  );
}
