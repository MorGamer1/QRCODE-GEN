import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from './providers';
import { cn } from '@/lib/utils';
import './globals.css';

// Self-hosted (not next/font/google) so `next build` never depends on reaching Google Fonts -
// self-hosters may build this image on networks with restricted/no egress. Variable font file
// covers the full weight axis (100-900) from a single ~350KB woff2, sourced from
// https://github.com/rsms/inter (OFL-1.1 licensed).
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: { default: 'QRGen — QR Code Generator', template: '%s · QRGen' },
  description:
    'Create, style, and track dynamic and static QR codes with real-time scan analytics. Self-hosted, open, and built for teams.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, 'min-h-screen bg-background font-sans text-foreground antialiased')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
