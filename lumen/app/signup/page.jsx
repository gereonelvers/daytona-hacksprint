'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api, setToken } from '../session.js';

function SignupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [ref, setRef] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const r = params.get('ref');
    if (r) setRef(r);
  }, [params]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await api('/api/signup', { method: 'POST', body: { email, referralCode: ref || undefined } });
      setToken(res.token);
      router.push('/generate');
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 32 }}>Create your account</h1>
      <p className="lede" style={{ fontSize: 16 }}>25 free credits are waiting. No card needed.</p>
      <form className="card" onSubmit={submit} style={{ marginTop: 22 }}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" value={email}
          onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
        <label htmlFor="ref">Referral code (optional)</label>
        <input id="ref" name="ref" placeholder="KV1234" value={ref} onChange={(e) => setRef(e.target.value)} />
        <div style={{ marginTop: 18 }}>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account →'}</button>
        </div>
        {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
        {ref && <div className="notice ok">Referral applied — you and your friend both get 50 bonus credits.</div>}
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="container">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}
