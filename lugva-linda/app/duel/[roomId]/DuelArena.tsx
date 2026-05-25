'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { DuelWord } from '@/actions/duel-actions';
import { Button, Badge } from '@/components/ui';
import { SessionHeader } from '@/components/review/SessionHeader';
import { DynamicProgressBar } from '@/components/review/controls/DynamicProgressBar';
import { SessionLayoutMotion } from '@/components/review/controls/SessionLayoutMotion';
import { toTint } from '@/lib/utils';
import { DuelActiveCard } from '@/components/duel/DuelActiveCard';
import { DuelExerciseInfo } from '@/components/duel/DuelExerciseInfo';
import { DuelGameOver } from '@/components/duel/DuelGameOver';
import { DuelScoreBoard } from '@/components/duel/DuelScoreBoard';
import { useDuelGame } from '@/hooks/useDuelGame';

type DuelArenaProps = {
  deck: DuelWord[];
  channel: RealtimeChannel;
  currentUserId: string;
  opponentId: string;
  languageName: string;
  currentUserName: string;
  currentUserColor: string;
  opponentName: string;
  opponentColor: string;
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    playing: 'En réflexion',
    found: 'Trouvé',
    skipped: 'Passé',
    timeout: 'Temps écoulé',
    surrendered: 'Abandon',
  };
  return map[status];
};

export const DuelArena = ({
  deck,
  channel,
  currentUserId,
  languageName,
  currentUserName,
  currentUserColor,
  opponentName,
  opponentColor,
}: DuelArenaProps) => {
  const { state, actions } = useDuelGame({ deck, channel });

  const wordOwnerColor =
    state.currentWord.ownerId === currentUserId
      ? currentUserColor
      : opponentColor;

  if (state.roundState === 'game-over') {
    return (
      <DuelGameOver
        matchHistory={state.matchHistory}
        myFinalScore={state.myScore}
        opponentFinalScore={state.opponentScore}
        myStatus={state.myStatus}
        opponentStatus={state.opponentStatus}
        currentUserName={currentUserName}
        currentUserColor={currentUserColor}
        opponentName={opponentName}
        opponentColor={opponentColor}
        languageName={languageName}
      />
    );
  }

  return (
    <div className="bg-background text-foreground flex min-h-[calc(100dvh-4rem)] w-full flex-col overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col p-4">
        <SessionHeader
          languageName={languageName}
          onQuit={actions.handleSurrender}
        />

        <div className="mb-2 flex shrink-0 flex-col gap-3 py-4">
          <DynamicProgressBar
            initialCount={deck.length}
            currentIndex={state.currentWordIndex + 1}
            lapsesCount={0}
          />

          <DuelScoreBoard
            myScore={state.myScore}
            opponentScore={state.opponentScore}
            myStreak={state.myStreak}
            opponentStreak={state.opponentStreak}
            currentUserName={currentUserName}
            currentUserColor={currentUserColor}
            opponentName={opponentName}
            opponentColor={opponentColor}
          />

          <DuelExerciseInfo />
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-4">
          <SessionLayoutMotion>
            <div className="flex min-h-8 flex-wrap items-end justify-center gap-2">
              {state.opponentStatus !== 'playing' && (
                <Badge
                  variant="outline"
                  className="border shadow-sm"
                  style={{
                    backgroundColor: toTint(opponentColor),
                    color: opponentColor,
                    borderColor: toTint(opponentColor),
                  }}
                >
                  {opponentName} : {getStatusText(state.opponentStatus)}
                </Badge>
              )}
            </div>

            <DuelActiveCard
              key={state.currentWord.id}
              currentWord={state.currentWord}
              wordOwnerColor={wordOwnerColor}
              roundState={state.roundState}
              myStatus={state.myStatus}
              isLocked={state.isLocked}
              inputValue={state.inputValue}
              setInputValue={actions.setInputValue}
              onSubmit={actions.handleSubmit}
              opponentName={opponentName}
              myRoundPoints={state.myRoundPoints}
              opponentRoundPoints={state.opponentRoundPoints}
              currentUserColor={currentUserColor}
              opponentColor={opponentColor}
            />

            <div className="mt-2 flex min-h-14 w-full flex-col items-center justify-center gap-4">
              {state.roundState === 'playing' &&
                state.myStatus === 'playing' && (
                  <Button
                    variant="secondary"
                    onClick={actions.handleSkip}
                    disabled={state.isLocked}
                  >
                    Passer
                  </Button>
                )}
            </div>
          </SessionLayoutMotion>
        </div>
      </div>
    </div>
  );
};
