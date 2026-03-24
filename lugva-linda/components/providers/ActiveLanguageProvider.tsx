'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { setActiveLanguage } from '@/actions/language-actions';

export type ActiveLanguageOption = {
  id: string;
  name: string;
};

type ActiveLanguageContextValue = {
  languages: ActiveLanguageOption[];
  activeLanguageId: string;
  isSwitchingLanguage: boolean;
  setLanguage: (languageId: string) => Promise<void>;
};

const ActiveLanguageContext = createContext<ActiveLanguageContextValue | null>(
  null,
);

type ActiveLanguageProviderProps = {
  languages: ActiveLanguageOption[];
  activeLanguageId: string;
  children: React.ReactNode;
};

export const ActiveLanguageProvider = ({
  languages,
  activeLanguageId,
  children,
}: ActiveLanguageProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentLanguageId, setCurrentLanguageId] = useState(activeLanguageId);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);

  useEffect(() => {
    setCurrentLanguageId(activeLanguageId);
  }, [activeLanguageId]);

  const setLanguage = useCallback(
    async (languageId: string) => {
      if (!languageId || languageId === currentLanguageId) return;

      setIsSwitchingLanguage(true);

      try {
        setCurrentLanguageId(languageId);
        await setActiveLanguage(languageId);

        const params = new URLSearchParams(searchParams.toString());
        params.set('lang', languageId);

        const query = params.toString();
        const nextPath = query.length > 0 ? `${pathname}?${query}` : pathname;
        router.replace(nextPath);
        router.refresh();
      } finally {
        setIsSwitchingLanguage(false);
      }
    },
    [currentLanguageId, pathname, router, searchParams],
  );

  const value = useMemo(
    () => ({
      languages,
      activeLanguageId: currentLanguageId,
      isSwitchingLanguage,
      setLanguage,
    }),
    [currentLanguageId, isSwitchingLanguage, languages, setLanguage],
  );

  return (
    <ActiveLanguageContext.Provider value={value}>
      {children}
    </ActiveLanguageContext.Provider>
  );
};

export const useActiveLanguage = () => {
  const context = useContext(ActiveLanguageContext);

  if (!context) {
    throw new Error(
      'useActiveLanguage must be used within ActiveLanguageProvider.',
    );
  }

  return context;
};

export const useMaybeActiveLanguage = () => useContext(ActiveLanguageContext);
