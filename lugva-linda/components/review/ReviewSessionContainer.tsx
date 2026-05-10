'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Word } from '@prisma/client';

import { PreSessionScreen } from './screens/PreSessionScreen';
import { ActiveSessionScreen } from './screens/ActiveSessionScreen';
import { PostSessionScreen } from './screens/PostSessionScreen';
import { EmptySessionScreen } from './screens/EmptySessionScreen';
import type { SessionStats } from '@/hooks/useReviewSession';
import { ReviewMode } from '@/lib/validation/schemas';
import { RouteErrorState } from '../shared';

type SessionState = 'pre' | 'active' | 'post';

type ReviewSessionContainerProps = {
  initialWords: Word[];
  mode?: ReviewMode;
  languageName?: string;
  isSimulationMode?: boolean;
};

export const ReviewSessionContainer = ({
  initialWords,
  mode = 'DUE_ONLY',
  languageName = 'Anglais',
  isSimulationMode = false,
}: ReviewSessionContainerProps) => {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('pre');
  const [stats, setStats] = useState<SessionStats | null>(null);

  const handleGoHome = () => router.push('/');

  if (sessionState === 'pre')
    if (initialWords.length === 0)
      return (
        <EmptySessionScreen onQuit={handleGoHome} languageName={languageName} />
      );
    else
      return (
        <PreSessionScreen
          wordCount={initialWords.length}
          mode={mode}
          languageName={languageName}
          onStart={() => setSessionState('active')}
          onQuit={handleGoHome}
        />
      );

  if (sessionState === 'active')
    return (
      <ActiveSessionScreen
        initialWords={initialWords}
        languageName={languageName}
        isSimulationMode={isSimulationMode}
        onComplete={(sessionStats) => {
          setStats(sessionStats);
          setSessionState('post');
        }}
        onQuit={handleGoHome}
      />
    );

  if (sessionState === 'post' && stats)
    return (
      <PostSessionScreen
        stats={stats}
        onQuit={handleGoHome}
        languageName={languageName}
      />
    );

  return (
    <RouteErrorState
      title="Erreur de session"
      description="L'état de la session est inconnu."
      onRetry={handleGoHome}
    />
  );
};
