'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreSessionScreen } from './screens/PreSessionScreen';
import { ActiveSessionScreen } from './screens/ActiveSessionScreen';
import { PostSessionScreen } from './screens/PostSessionScreen';
import { EmptySessionScreen } from './screens/EmptySessionScreen';
import type { SessionStats } from '@/hooks/useReviewSession';
import { ReviewCard, ReviewMode } from '@/lib/validation/schemas';
import { RouteErrorState } from '../shared';

type SessionState = 'pre' | 'active' | 'post';

type ReviewSessionContainerProps = {
  initialCards: ReviewCard[];
  mode?: ReviewMode;
  languageName?: string;
  isSimulationMode?: boolean;
};

export const ReviewSessionContainer = ({
  initialCards = [],
  mode = 'DUE_ONLY',
  languageName = 'Anglais',
  isSimulationMode = false,
}: ReviewSessionContainerProps) => {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('pre');
  const [stats, setStats] = useState<SessionStats | null>(null);

  const handleGoHome = () => router.push('/');

  if (sessionState === 'pre')
    if (initialCards.length === 0)
      return (
        <EmptySessionScreen onQuit={handleGoHome} languageName={languageName} />
      );
    else
      return (
        <PreSessionScreen
          wordCount={initialCards.length}
          mode={mode}
          languageName={languageName}
          onStart={() => setSessionState('active')}
          onQuit={handleGoHome}
        />
      );

  if (sessionState === 'active')
    return (
      <ActiveSessionScreen
        initialCards={initialCards}
        mode={mode}
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
        mode={mode}
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
