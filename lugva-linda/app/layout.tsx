import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { WordModalProvider } from '@/components/providers/WordModalProvider';
import { PresenceProvider } from '@/components/providers/PresenceProvider';
import { CommunityImportProvider } from '@/components/providers/CommunityImportProvider';
import { UserProvider } from '@/components/providers/UserProvider';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { ActiveLanguageProvider } from '@/components/providers/ActiveLanguageProvider';

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
  const profile = await getCurrentUserProfile();
  const languages = profile?.learningLanguages.map((ll) => ll.language) || [];
  const activeLanguageId =
    profile?.activeLanguageId || languages[0]?.id || null;

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PresenceProvider>
          <ToastProvider>
            <CommunityImportProvider>
              <WordModalProvider>
                <UserProvider initialUser={profile}>
                  <ActiveLanguageProvider
                    languages={languages}
                    activeLanguageId={activeLanguageId ?? ''}
                  >
                    {children}
                  </ActiveLanguageProvider>
                </UserProvider>
              </WordModalProvider>
            </CommunityImportProvider>
          </ToastProvider>
        </PresenceProvider>
      </body>
    </html>
  );
}
