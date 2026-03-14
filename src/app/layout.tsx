import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AppShell } from '@/components/app-shell/app-shell';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Setlist — Seus Shows do Ano',
  description: 'Organize seus shows, festivais e viagens musicais',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Setlist',
    startupImage: '/icon.svg',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'Setlist',
    description: 'Organize seus shows, festivais e viagens musicais',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a1a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          'antialiased min-h-screen bg-background text-foreground',
        )}
      >
        <ThemeProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
