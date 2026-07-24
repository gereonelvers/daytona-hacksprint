'use client';

import { useState } from 'react';
import { Transcript } from './Transcript';

/**
 * A single failed call. Collapsed by default — the list is the taxonomy made
 * concrete, and a reader should be able to scan twelve of them before deciding
 * which one to open.
 */
export function CallCard({ call, rank }) {
  const [open, setOpen] = useState(rank === 1);
  return (
    <article className="call">
      <button
        className="call-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`call-${call.id}`}
      >
        <span className="call-rank">{String(rank).padStart(2, '0')}</span>
        <span>
          <span className="call-title">
            {call.strategyLabel} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>as</span> {call.personaLabel}
          </span>
          <span className="call-meta">
            {call.violations.length} violation{call.violations.length === 1 ? '' : 's'} · severity {call.severity} ·
            broke on turn {breakTurn(call)} · {call.pressureId} pressure
          </span>
        </span>
        <span className="chips">
          {call.violations.map((v) => (
            <span key={v.id} className={`chip${v.method === 'judge' ? ' judged' : ''}`}>
              {v.id}
            </span>
          ))}
        </span>
      </button>
      {open && (
        <div className="call-body" id={`call-${call.id}`}>
          <Transcript turns={call.transcript} />
        </div>
      )}
    </article>
  );
}

function breakTurn(call) {
  const t = call.transcript.find((x) => x.role === 'tool' && x.violations?.length > 0);
  if (t) return t.turn;
  const v = call.violations.find((x) => x.turn);
  return v?.turn ?? '—';
}
