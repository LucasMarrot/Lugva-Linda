import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { WordModalProvider } from '@/components/providers/WordModalProvider';
import { PresenceProvider } from '@/components/providers/PresenceProvider';
import { CommunityImportProvider } from '@/components/providers/CommunityImportProvider';
import { UserProvider } from '@/components/providers/UserProvider';
import { getCurrentUserProfile } from '@/lib/auth/server';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUserProfile();

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PresenceProvider>
          <ToastProvider>
            <CommunityImportProvider>
              <WordModalProvider>
                <UserProvider initialUser={initialUser}>
                  {children}
                </UserProvider>
              </WordModalProvider>
            </CommunityImportProvider>
          </ToastProvider>
        </PresenceProvider>
      </body>
    </html>
  );
}
