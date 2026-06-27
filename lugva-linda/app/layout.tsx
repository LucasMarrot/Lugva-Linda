import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ToastProvider,
  UserProvider,
  PresenceProvider,
  CommunityImportProvider,
  WordModalProvider,
  ActiveLanguageProvider,
  ThemeProvider,
} from '@/components/providers';
import { getCurrentUserProfile } from '@/lib/auth/server';
import { getThemeColor } from '@/lib/users/colors';

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
  const userColor = profile?.colorHex || '';
  const darkColor = userColor ? getThemeColor(userColor, 'dark') : '';
  const isContributorMode = profile?.role === 'CONTRIBUTOR';

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      style={
        {
          '--user-primary-light': userColor || undefined,
          '--user-primary-dark': darkColor || undefined,
        } as React.CSSProperties
      }
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <UserProvider initialUser={profile}>
              <PresenceProvider>
                <CommunityImportProvider>
                  <WordModalProvider isContributorMode={isContributorMode}>
                    <ActiveLanguageProvider
                      languages={languages}
                      activeLanguageId={activeLanguageId ?? ''}
                    >
                      {children}
                    </ActiveLanguageProvider>
                  </WordModalProvider>
                </CommunityImportProvider>
              </PresenceProvider>
            </UserProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
