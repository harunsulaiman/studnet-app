import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/AppShell';
import '@/app/shell.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'studNet — The student network, reimagined',
  description: 'Feed, academics, messages and opportunities in one blazing-fast student app.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
