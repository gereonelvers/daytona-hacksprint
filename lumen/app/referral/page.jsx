'use client';

import { useState, useEffect } from 'react';
import { api, getToken } from '../session.js';

export default function ReferralPage() {
  const [me, setMe] = useState(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    if (getToken()) api('/api/me').then(setMe).catch(() => setMe(null));
  }, []);

  if (!getToken()) {
    return (
      <div className="container" style={{ maxWidth: 560 }}>
        <div className="card">
          <h2>Refer a friend, earn 50 credits</h2>
          <p className="sub">Sign in to get your personal referral link.</p>
          <a className="btn" href="/signup">Get started →</a>
        </div>
      </div>
    );
  }

  const code = me?.account?.referralCode;
  const link = code ? `${origin}/signup?ref=${code}` : '';

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <h2>Invite friends, both get 50 credits</h2>
        <p className="sub">Share your link. Every friend who joins earns you both 50 credits — instantly, no limit.</p>
        <label>Your referral link</label>
        <div className="referral-link" data-testid="referral-link">{link || '…'}</div>
        <div className="row" style={{ marginTop: 16 }}>
          <span className="pill">Your code: <span className="mono" data-testid="referral-code">{code || '…'}</span></span>
          <span className="pill">Balance: {me?.account?.credits ?? '—'} credits</span>
        </div>
      </div>
    </div>
  );
}
