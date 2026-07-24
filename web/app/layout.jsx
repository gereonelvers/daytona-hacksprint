import { Bricolage_Grotesque, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Display carries the brand's loudness; body stays tight and quiet so the data
// reads fast; mono is reserved for anything machine-generated (transcripts,
// tool calls, counts) so the reader can always tell evidence from prose.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700', '800'],
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
  title: 'hirekevin — adversarial red-teaming for AI agents',
  description:
    'Kevin runs hundreds of hostile conversations against your support agent in isolated sandboxes, then shows you every policy it broke — with receipts.',
  openGraph: {
    title: 'hirekevin',
    description: 'Hundreds of adversarial calls. Every policy break, with receipts.',
    type: 'website',
  },
};

export const viewport = { themeColor: '#EFECE4' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
