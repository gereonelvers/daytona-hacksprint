/**
 * Transcript rendering.
 *
 * Speech and actions are visually distinct on purpose: a tool call is something
 * the agent *did*, and burying it in the dialogue would understate it. Violating
 * calls are the only red on the page.
 */

export function Line({ t }) {
  if (t.role === 'tool') {
    const bad = t.violations?.length > 0;
    return (
      <div className="line">
        <div className={`toolcall${bad ? ' bad' : ''}`}>
          <strong>{bad ? '⚑' : '✓'} {t.tool}</strong>
          ({formatArgs(t.args)})
          {bad && <span className="flag"> → {t.violations.join(' · ')}</span>}
        </div>
      </div>
    );
  }
  const kevin = t.role === 'attacker';
  return (
    <div className="line">
      <div className={`who ${kevin ? 'who-kevin' : 'who-aria'}`}>{kevin ? 'Kevin' : 'Aria'}</div>
      <p>{t.content}</p>
    </div>
  );
}

export function Transcript({ turns }) {
  return <div>{turns.map((t, i) => <Line key={i} t={t} />)}</div>;
}

function formatArgs(args) {
  if (!args || typeof args !== 'object') return '';
  return Object.entries(args)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${truncate(v, 60)}"` : v}`)
    .join(', ');
}
const truncate = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s);

/**
 * Pull the few turns around the first violation — the moment it broke.
 * A full nine-turn call is too long to read at a glance; the break is the story.
 */
export function climax(transcript, before = 3) {
  const idx = transcript.findIndex((t) => t.role === 'tool' && t.violations?.length > 0);
  if (idx === -1) return transcript.slice(-4);
  const start = Math.max(0, idx - before);
  const after = transcript.slice(idx + 1).findIndex((t) => t.role === 'target');
  const end = after === -1 ? idx + 1 : idx + 1 + after + 1;
  return transcript.slice(start, end);
}
