import { Anton, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Anton is the poster voice — condensed, heavy, unmissable. It carries the
// brand's loudness (Kevin doesn't do subtle). Body stays tight and quiet so the
// data reads fast; mono is reserved for anything machine-generated (traces,
// tool calls, ledgers) so the reader can always tell evidence from prose.
const display = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});
const body = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://testwithkevin.com'),
  title: 'testwithkevin — point Kevin at your app before your users do',
  description:
    'Kevin is your worst thousand users. Verify your domain, send him in, and he hunts the economic exploits that quietly kill your business — with receipts.',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  openGraph: {
    title: 'testwithkevin',
    description: 'Adversarial abuse testing for web apps. Send Kevin in.',
    type: 'website',
  },
};

export const viewport = { themeColor: '#efece4' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
