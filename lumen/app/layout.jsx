import './globals.css';

export const metadata = {
  title: 'Lumen — AI generation for everyone',
  description: 'Turn a prompt into a picture. 25 free credits to start.',
};
export const viewport = { themeColor: '#0b0f1e' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <a className="logo" href="/">
            <span className="logo-mark">✦</span> Lumen
          </a>
          <div className="nav-links">
            <a href="/generate">Studio</a>
            <a href="/referral">Refer</a>
            <a href="/pricing">Pricing</a>
            <a href="/signup">Get started</a>
          </div>
        </nav>
        {children}
        <footer>
          Lumen is a fictional AI SaaS built as a red-team target for testwithkevin.com. No real accounts, no real charges.
        </footer>
      </body>
    </html>
  );
}
