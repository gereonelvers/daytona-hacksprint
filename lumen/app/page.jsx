export default function Home() {
  return (
    <div className="container">
      <span className="pill" style={{ marginBottom: 16, display: 'inline-block' }}>✦ Now in open beta</span>
      <h1>Turn a sentence into a picture.</h1>
      <p className="lede">
        Lumen is the fastest way to generate images and copy from a prompt. Sign up and get{' '}
        <strong>25 free credits</strong> — no card required. Invite a friend and you both get 50 more.
      </p>
      <div className="hero-cta">
        <a className="btn" href="/signup">Start free →</a>
        <a className="btn ghost" href="/generate">Open the studio</a>
      </div>

      <div className="feature-row">
        <div className="card">
          <h2>✦ 25 free credits</h2>
          <p className="sub">Every new account starts with enough to make 25 generations. On us.</p>
        </div>
        <div className="card">
          <h2>◎ Refer & earn</h2>
          <p className="sub">Share your link. When a friend joins, you both get 50 credits, instantly.</p>
        </div>
        <div className="card">
          <h2>⚡ Instant studio</h2>
          <p className="sub">Type a prompt, hit generate. Powered by fast open models.</p>
        </div>
      </div>
    </div>
  );
}
