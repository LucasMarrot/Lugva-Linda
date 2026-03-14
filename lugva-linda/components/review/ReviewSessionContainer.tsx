'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Word } from '@prisma/client';

import { PreSessionScreen } from './screens/PreSessionScreen';
import { ActiveSessionScreen } from './screens/ActiveSessionScreen';
import { PostSessionScreen } from './screens/PostSessionScreen';
import { EmptySessionScreen } from './screens/EmptySessionScreen';
import type { SessionStats } from '@/hooks/useReviewSession';

type SessionState = 'pre' | 'active' | 'post';

export type ReviewSessionIntent =
  | { mode: 'DUE_ONLY' }
  | { mode: 'FORCED_FILL'; targetCount: number };

type ReviewSessionContainerProps = {
  initialWords: Word[];
  sessionIntent?: ReviewSessionIntent;
};

export const ReviewSessionContainer = ({
  initialWords,
  sessionIntent = { mode: 'DUE_ONLY' },
}: ReviewSessionContainerProps) => {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<SessionState>('pre');
  const [stats, setStats] = useState<SessionStats | null>(null);

  const handleGoHome = () => router.push('/');

  if (initialWords.length === 0)
    return <EmptySessionScreen onGoHome={handleGoHome} />;

  if (sessionState === 'pre')
    return (
      <PreSessionScreen
        wordCount={initialWords.length}
        sessionIntent={sessionIntent}
        onStart={() => setSessionState('active')}
        onQuit={handleGoHome}
      />
    );

  if (sessionState === 'active')
    return (
      <ActiveSessionScreen
        initialWords={initialWords}
        onComplete={(sessionStats) => {
          setStats(sessionStats);
          setSessionState('post');
        }}
        onQuit={handleGoHome}
      />
    );

  if (sessionState === 'post' && stats)
    return <PostSessionScreen stats={stats} />;

  return null;
};
