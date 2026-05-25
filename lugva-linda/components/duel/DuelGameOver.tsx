'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  Flag,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui';
import { SessionHeader } from '@/components/review/SessionHeader';
import { triggerConfetti } from '@/lib/confetti';
import { cn } from '@/lib/utils';
import { DuelScoreBoard } from './DuelScoreBoard';
import { MatchHistoryItem, PlayerStatus } from '@/hooks/useDuelGame';
import { SectionHeader } from '../shared';

type DuelGameOverProps = {
  matchHistory: MatchHistoryItem[];
  myFinalScore: number;
  opponentFinalScore: number;
  myStatus: PlayerStatus;
  opponentStatus: PlayerStatus;
  currentUserName: string;
  currentUserColor: string;
  opponentName: string;
  opponentColor: string;
  languageName: string;
};

const StatusResult = ({
  status,
  points,
  isRight = false,
}: {
  status: PlayerStatus;
  points: number;
  isRight?: boolean;
}) => {
  if (status === 'found')
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 font-bold text-emerald-500',
          isRight && 'flex-row-reverse',
        )}
      >
        <CheckCircle2 className="h-4 w-4" />{' '}
        <span className="text-sm">+{points}</span>
      </div>
    );
  if (status === 'skipped')
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-orange-500 opacity-80',
          isRight && 'flex-row-reverse',
        )}
      >
        <SkipForward className="h-4 w-4" />{' '}
        <span className="text-xs font-medium">Passé</span>
      </div>
    );
  if (status === 'timeout')
    return (
      <div
        className={cn(
          'text-destructive flex items-center gap-1.5 opacity-80',
          isRight && 'flex-row-reverse',
        )}
      >
        <Clock className="h-4 w-4" />{' '}
        <span className="text-xs font-medium">Temps</span>
      </div>
    );
  if (status === 'surrendered')
    return (
      <div
        className={cn(
          'text-destructive flex items-center gap-1.5 opacity-80',
          isRight && 'flex-row-reverse',
        )}
      >
        <Flag className="h-4 w-4" />{' '}
        <span className="text-xs font-medium">Abandon</span>
      </div>
    );
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center gap-1.5',
        isRight && 'flex-row-reverse',
      )}
    >
      <XCircle className="h-4 w-4 opacity-50" />
    </div>
  );
};

export const DuelGameOver = ({
  matchHistory,
  myFinalScore,
  opponentFinalScore,
  myStatus,
  opponentStatus,
  currentUserName,
  currentUserColor,
  opponentName,
  opponentColor,
  languageName,
}: DuelGameOverProps) => {
  const router = useRouter();

  const [revealedIndex, setRevealedIndex] = useState(0);

  const isRecapFinished = revealedIndex >= matchHistory.length;
  const listEndRef = useRef<HTMLDivElement>(null);
  const victoryBadgeRef = useRef<HTMLDivElement>(null);

  const displayedMyScore = isRecapFinished
    ? myFinalScore
    : matchHistory
        .slice(0, revealedIndex)
        .reduce((acc, item) => acc + item.myPoints, 0);

  const displayedOppScore = isRecapFinished
    ? opponentFinalScore
    : matchHistory
        .slice(0, revealedIndex)
        .reduce((acc, item) => acc + item.opponentPoints, 0);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealedIndex]);

  useEffect(() => {
    if (revealedIndex < matchHistory.length) {
      const timer = setTimeout(() => {
        setRevealedIndex((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [revealedIndex, matchHistory.length]);

  useEffect(() => {
    if (
      isRecapFinished &&
      (myFinalScore > opponentFinalScore || opponentStatus === 'surrendered')
    ) {
      const confettiColor =
        myFinalScore > opponentFinalScore || opponentStatus === 'surrendered'
          ? currentUserColor
          : opponentColor;
      const timer = setTimeout(() => {
        if (victoryBadgeRef.current) {
          triggerConfetti(victoryBadgeRef.current, confettiColor);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    currentUserColor,
    isRecapFinished,
    myFinalScore,
    opponentColor,
    opponentFinalScore,
    opponentStatus,
  ]);

  let finalTitle = 'Égalité parfaite !';
  if (myStatus === 'surrendered') finalTitle = 'Vous avez abandonné...';
  else if (opponentStatus === 'surrendered')
    finalTitle = `${opponentName} a fui !`;
  else if (myFinalScore > opponentFinalScore) finalTitle = 'Victoire !';
  else if (myFinalScore < opponentFinalScore) finalTitle = 'Défaite...';

  return (
    <div className="bg-background text-foreground flex h-dvh w-full flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col p-4">
        <div className="shrink-0">
          <SessionHeader languageName={languageName} />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-6">
          <AnimatePresence>
            {isRecapFinished && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                className="shrink-0 overflow-hidden"
              >
                <div
                  ref={victoryBadgeRef}
                  className={cn(
                    'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full p-4 ring-8',
                    myFinalScore > opponentFinalScore ||
                      opponentStatus === 'surrendered'
                      ? 'bg-yellow-500/10 text-yellow-500 ring-yellow-500/5'
                      : 'bg-muted ring-muted/50 text-muted-foreground',
                  )}
                >
                  <Trophy className="h-10 w-10" />
                </div>

                <h1 className="from-foreground to-foreground/70 bg-linear-to-br bg-clip-text text-center text-3xl font-black tracking-widest text-transparent uppercase">
                  {finalTitle}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-transparent">
            <div className="shrink-0 px-4">
              <SectionHeader title="Récapitulatif du duel" />
            </div>

            <div className="m-4 shrink-0">
              <DuelScoreBoard
                myScore={displayedMyScore}
                opponentScore={displayedOppScore}
                myStreak={0}
                opponentStreak={0}
                currentUserName={currentUserName}
                currentUserColor={currentUserColor}
                opponentName={opponentName}
                opponentColor={opponentColor}
              />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <AnimatePresence initial={false}>
                {matchHistory.slice(0, revealedIndex).map((item, idx) => (
                  <motion.div
                    key={item.id + idx}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="grid w-full grid-cols-3 items-center p-4"
                  >
                    <div className="flex justify-start">
                      <StatusResult
                        status={item.myStatus}
                        points={item.myPoints}
                      />
                    </div>
                    <div className="px-2 text-center text-sm font-bold tracking-tight">
                      <p>{item.term}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.translation}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <StatusResult
                        status={item.opponentStatus}
                        points={item.opponentPoints}
                        isRight
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={listEndRef} className="h-0 w-full" />
            </div>
          </div>

          <AnimatePresence>
            {isRecapFinished && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-auto shrink-0 pt-2 pb-4"
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Terminer et quitter
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
