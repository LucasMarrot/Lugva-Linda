import './globals.css';
import type { Metadata, Viewport } from 'next';
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
import { GlobalPageTransition } from '@/components/layout/GlobalPageTransition';
import { AppSplashScreen } from '@/components/layout/AppSplashScreen';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Lugva Linda',
  description: 'Apprendre le vocabulaire',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lugva Linda',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
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
        <ServiceWorkerRegistration />
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
                      <AppSplashScreen>
                        <GlobalPageTransition>
                          {children}
                        </GlobalPageTransition>
                      </AppSplashScreen>
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
