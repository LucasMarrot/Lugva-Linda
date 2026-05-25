'use client';

import { motion } from 'framer-motion';

import { DuelWord } from '@/actions/duel-actions';
import { Badge } from '@/components/ui';
import { CardFace } from '@/components/review/flashcard/faces/CardFace';
import { FlashcardMotion } from '@/components/review/flashcard/FlashCardMotion';
import { SpellingForm } from '@/components/review/exercises/spelling/SpellingForm';
import { SpellingTimerBorder } from '@/components/review/exercises/spelling/SpellingTimerBorder';
import { cn, toTint } from '@/lib/utils';

type PlayerStatus = 'playing' | 'found' | 'skipped' | 'timeout' | 'surrendered';
type RoundState = 'playing' | 'ended' | 'game-over';

type DuelActiveCardProps = {
  currentWord: DuelWord;
  wordOwnerColor: string;
  roundState: RoundState;
  myStatus: PlayerStatus;
  isLocked: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  opponentName: string;
  myRoundPoints: number;
  opponentRoundPoints: number;
  currentUserColor: string;
  opponentColor: string;
};

export const DuelActiveCard = ({
  currentWord,
  wordOwnerColor,
  roundState,
  myStatus,
  isLocked,
  inputValue,
  setInputValue,
  onSubmit,
  opponentName,
  myRoundPoints,
  opponentRoundPoints,
  currentUserColor,
  opponentColor,
}: DuelActiveCardProps) => {
  return (
    <div
      className="mx-auto flex w-full max-w-sm flex-col"
      style={
        {
          '--territory-bg': `${wordOwnerColor}0D`,
          '--territory-border': `${wordOwnerColor}66`,
          '--territory-shadow': `inset 0 0 60px ${wordOwnerColor}33, 0 8px 30px ${wordOwnerColor}26`,
        } as React.CSSProperties
      }
    >
      <motion.div
        animate={isLocked ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <FlashcardMotion isFlipped={roundState === 'ended'} onFlip={() => {}}>
          {/* RECTO */}
          <CardFace
            className={cn(
              'min-h-62.5 transition-all duration-1000',
              myStatus !== 'playing'
                ? 'bg-primary text-primary-foreground border-primary shadow-xl'
                : isLocked
                  ? 'bg-destructive/5 border-destructive/40 shadow-[inset_0_0_60px_rgba(239,68,68,0.15)]'
                  : 'border-(--territory-border) bg-(--territory-bg) shadow-(--territory-shadow)',
            )}
          >
            {myStatus === 'playing' && <SpellingTimerBorder duration={15} />}

            {myStatus !== 'playing' ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-8">
                <h2 className="text-center text-4xl font-bold tracking-tight">
                  {currentWord.translation}
                </h2>
                {roundState !== 'ended' && (
                  <p className="text-primary-foreground/80 mt-4 animate-pulse text-sm">
                    En attente de {opponentName}...
                  </p>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  'w-full px-6 transition-opacity duration-300',
                  isLocked && 'pointer-events-none opacity-60',
                )}
              >
                <SpellingForm
                  translation={currentWord.translation}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSubmit={onSubmit}
                />
              </div>
            )}
          </CardFace>

          {/* VERSO */}
          <CardFace
            isBack
            className="bg-secondary text-secondary-foreground border-border flex min-h-62.5 flex-col items-center justify-center gap-6 py-8 shadow-xl"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-primary text-center text-3xl font-bold">
                {currentWord.term}
              </h2>
              <p className="text-muted-foreground text-xl font-medium">
                {currentWord.translation}
              </p>
            </div>
            <div className="flex w-full justify-center gap-3 px-4">
              <Badge
                className="border px-3 py-1 text-base shadow-sm"
                style={{
                  backgroundColor: toTint(currentUserColor),
                  color: currentUserColor,
                  borderColor: toTint(currentUserColor),
                }}
              >
                Moi : +{myRoundPoints}
              </Badge>
              <Badge
                className="border px-3 py-1 text-base shadow-sm"
                style={{
                  backgroundColor: toTint(opponentColor),
                  color: opponentColor,
                  borderColor: toTint(opponentColor),
                }}
              >
                Adv : +{opponentRoundPoints}
              </Badge>
            </div>
          </CardFace>
        </FlashcardMotion>
      </motion.div>
    </div>
  );
};
