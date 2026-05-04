import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { WordModalProvider } from '@/components/providers/WordModalProvider';
import { PresenceProvider } from '@/components/providers/PresenceProvider';
import { CommunityImportProvider } from '@/components/providers/CommunityImportProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lugva Linda',
  description: 'Apprendre le vocabulaire',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PresenceProvider>
          <ToastProvider>
            <CommunityImportProvider>
              <WordModalProvider>{children}</WordModalProvider>
            </CommunityImportProvider>
          </ToastProvider>
        </PresenceProvider>
      </body>
    </html>
  );
}
