'use client';

import { PlayerScorePanel, TugOfWar } from './duel-score-board/';

type DuelScoreBoardProps = {
  myScore: number;
  opponentScore: number;
  myStreak: number;
  opponentStreak: number;
  currentUserName: string;
  currentUserColor: string;
  opponentName: string;
  opponentColor: string;
};

export const DuelScoreBoard = ({
  myScore,
  opponentScore,
  myStreak,
  opponentStreak,
  currentUserName,
  currentUserColor,
  opponentName,
  opponentColor,
}: DuelScoreBoardProps) => {
  const totalScore = myScore + opponentScore;
  const myPercentage = totalScore === 0 ? 50 : (myScore / totalScore) * 100;

  return (
    <div className="flex w-full items-center justify-between gap-0 px-6 pt-2 pb-2">
      <PlayerScorePanel
        name={currentUserName}
        score={myScore}
        streak={myStreak}
        color={currentUserColor}
        align="left"
      />

      <TugOfWar
        myPercentage={myPercentage}
        currentUserColor={currentUserColor}
        opponentColor={opponentColor}
      />

      <PlayerScorePanel
        name={opponentName}
        score={opponentScore}
        streak={opponentStreak}
        color={opponentColor}
        align="right"
      />
    </div>
  );
};
