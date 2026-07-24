'use client';

import { useState, useEffect } from 'react';
import { api, getToken } from '../session.js';

export default function GeneratePage() {
  const [me, setMe] = useState(null);
  const [prompt, setPrompt] = useState('a lighthouse at dusk, watercolor');
  const [count, setCount] = useState(1);
  const [out, setOut] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try { setMe(await api('/api/me')); } catch { setMe(null); }
  }
  useEffect(() => { if (getToken()) refresh(); }, []);

  async function generate(e) {
    e.preventDefault();
    setBusy(true); setMsg(null); setOut(null);
    try {
      const res = await api('/api/generate', { method: 'POST', body: { prompt, count: Number(count) } });
      setOut(res);
      await refresh();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
    setBusy(false);
  }

  if (!getToken()) {
    return (
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="card">
          <h2>Sign in to open the studio</h2>
          <p className="sub">You need an account to generate. It’s free.</p>
          <a className="btn" href="/signup">Get 25 free credits →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="balance">
            <span className="n" data-testid="balance">{me?.account?.credits ?? '—'}</span>
            <span className="u">credits</span>
          </div>
          <span className={`pill ${me?.account?.plan === 'pro' ? 'pro' : ''}`}>{me?.account?.plan || 'free'} plan</span>
        </div>
      </div>

      <form className="card" onSubmit={generate}>
        <h2>Studio</h2>
        <p className="sub">Describe what you want. One credit per generation.</p>
        <label htmlFor="prompt">Prompt</label>
        <input id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <label htmlFor="count">Batch size</label>
        <input id="count" type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)} />
        <div style={{ marginTop: 18 }}>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Generating…' : 'Generate →'}</button>
        </div>
        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
        {out && (
          <div className="notice ok" data-testid="gen-result">
            Generated {out.generated} image{out.generated === 1 ? '' : 's'} for {out.chargedCredits} credit.
            {out.sample && <div className="muted mono" style={{ marginTop: 8 }}>“{out.sample}”</div>}
          </div>
        )}
      </form>
    </div>
  );
}
