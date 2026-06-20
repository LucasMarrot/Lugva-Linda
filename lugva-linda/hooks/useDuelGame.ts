'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { DuelWord } from '@/actions/duel-actions';
import { normalizeWord } from '@/components/review/exercises/spelling/spelling-utils';
import { formatConcept } from '@/lib/utils';

export type PlayerStatus =
  | 'playing'
  | 'found'
  | 'skipped'
  | 'timeout'
  | 'surrendered';
export type RoundState = 'playing' | 'ended' | 'game-over';

export type MatchHistoryItem = {
  id: string;
  term: string;
  translation: string;
  myStatus: PlayerStatus;
  opponentStatus: PlayerStatus;
  myPoints: number;
  opponentPoints: number;
};

type UseDuelGameProps = {
  deck: DuelWord[];
  channel: RealtimeChannel;
};

const getMultiplier = (streak: number) =>
  streak > 1 ? 1 + (streak - 1) * 0.2 : 1;

const TIMEOUT_DURATION = 15000; // 15 secondes
const PENALTY_DURATION = 1500; // 1.5 secondes
const WIN_BASE_POINTS = 100;
const SEE_RESULT_DURATION = 4500; // 4.5 secondes

export const useDuelGame = ({ deck, channel }: UseDuelGameProps) => {
  const router = useRouter();

  // --- ÉTATS GLOBAUX DU MATCH ---
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);

  // --- ÉTATS DU ROUND COURANT ---
  const [myStatus, setMyStatus] = useState<PlayerStatus>('playing');
  const [opponentStatus, setOpponentStatus] = useState<PlayerStatus>('playing');

  const [myRoundPoints, setMyRoundPoints] = useState(0);
  const [opponentRoundPoints, setOpponentRoundPoints] = useState(0);

  const [myStreak, setMyStreak] = useState(0);
  const [opponentStreak, setOpponentStreak] = useState(0);

  const [roundState, setRoundState] = useState<RoundState>('playing');
  const [roundStartTime, setRoundStartTime] = useState(() => Date.now());

  // --- ÉTATS DU FORMULAIRE ---
  const [attempts, setAttempts] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const currentWord = deck[currentWordIndex];

  // --- RÉFÉRENCES ---
  const myStatusRef = useRef<PlayerStatus>('playing');
  const opponentStatusRef = useRef<PlayerStatus>('playing');
  const roundStateRef = useRef<RoundState>('playing');
  const currentWordIndexRef = useRef(0);
  const myRoundPointsRef = useRef(0);
  const opponentRoundPointsRef = useRef(0);

  useEffect(() => {
    if (!isLocked) return;
    const timeout = setTimeout(() => setIsLocked(false), PENALTY_DURATION);
    return () => clearTimeout(timeout);
  }, [isLocked]);

  const checkRoundEnd = useCallback(() => {
    if (
      roundStateRef.current === 'playing' &&
      myStatusRef.current !== 'playing' &&
      opponentStatusRef.current !== 'playing'
    ) {
      roundStateRef.current = 'ended';
      setRoundState('ended');
      setIsLocked(false);

      const currentDeckWord = deck[currentWordIndexRef.current];
      const displayTerms = formatConcept(
        currentDeckWord.term,
        currentDeckWord.synonyms,
      );

      setMatchHistory((prev) => [
        ...prev,
        {
          id: currentDeckWord.id,
          term: displayTerms,
          translation: currentDeckWord.translation,
          myStatus: myStatusRef.current,
          opponentStatus: opponentStatusRef.current,
          myPoints: myRoundPointsRef.current,
          opponentPoints: opponentRoundPointsRef.current,
        },
      ]);

      setTimeout(() => {
        if (currentWordIndexRef.current + 1 < deck.length) {
          currentWordIndexRef.current += 1;
          myStatusRef.current = 'playing';
          opponentStatusRef.current = 'playing';
          roundStateRef.current = 'playing';
          myRoundPointsRef.current = 0;
          opponentRoundPointsRef.current = 0;

          setCurrentWordIndex((prev) => prev + 1);
          setMyStatus('playing');
          setOpponentStatus('playing');
          setMyRoundPoints(0);
          setOpponentRoundPoints(0);
          setRoundState('playing');
          setAttempts([]);
          setInputValue('');
          setRoundStartTime(Date.now());
        } else {
          roundStateRef.current = 'game-over';
          setRoundState('game-over');
        }
      }, SEE_RESULT_DURATION);
    }
  }, [deck]);

  const updateMyStatus = useCallback(
    (newStatus: PlayerStatus) => {
      myStatusRef.current = newStatus;
      setMyStatus(newStatus);
      checkRoundEnd();
    },
    [checkRoundEnd],
  );

  const updateOpponentStatus = useCallback(
    (newStatus: PlayerStatus) => {
      opponentStatusRef.current = newStatus;
      setOpponentStatus(newStatus);
      checkRoundEnd();
    },
    [checkRoundEnd],
  );

  useEffect(() => {
    channel.on('broadcast', { event: 'word-finished' }, (payload) => {
      const { status, points, index, streak } = payload.payload;
      if (
        index === currentWordIndexRef.current &&
        opponentStatusRef.current === 'playing'
      ) {
        setOpponentRoundPoints(points);
        opponentRoundPointsRef.current = points;

        setOpponentScore((prev) => prev + points);
        if (streak !== undefined) setOpponentStreak(streak);

        updateOpponentStatus(status);
      }
    });

    channel.on('broadcast', { event: 'surrender' }, () => {
      if (opponentStatusRef.current !== 'surrendered') {
        updateOpponentStatus('surrendered');
        roundStateRef.current = 'game-over';
        setRoundState('game-over');
      }
    });

    return () => {};
  }, [channel, updateOpponentStatus]);

  useEffect(() => {
    if (roundState !== 'playing' || myStatus !== 'playing') return;

    const timeoutId = setTimeout(() => {
      if (myStatusRef.current === 'playing') {
        setMyRoundPoints(0);
        myRoundPointsRef.current = 0;
        setMyStreak(0);
        channel.send({
          type: 'broadcast',
          event: 'word-finished',
          payload: {
            status: 'timeout',
            points: 0,
            index: currentWordIndexRef.current,
            streak: 0,
          },
        });

        updateMyStatus('timeout');
      }
    }, TIMEOUT_DURATION);

    return () => clearTimeout(timeoutId);
  }, [roundState, myStatus, channel, updateMyStatus]);

  // --- ACTIONS DE L'UTILISATEUR ---
  const handleSurrender = () => {
    channel.send({ type: 'broadcast', event: 'surrender', payload: {} });
    updateMyStatus('surrendered');
    roundStateRef.current = 'game-over';
    setRoundState('game-over');
    router.push('/');
  };

  const handleSkip = () => {
    if (myStatusRef.current !== 'playing') return;

    setMyRoundPoints(0);
    myRoundPointsRef.current = 0;
    setMyStreak(0);
    channel.send({
      type: 'broadcast',
      event: 'word-finished',
      payload: {
        status: 'skipped',
        points: 0,
        index: currentWordIndexRef.current,
        streak: 0,
      },
    });

    updateMyStatus('skipped');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (myStatusRef.current !== 'playing' || isLocked || !inputValue.trim())
      return;

    const validAnswers = [
      currentWord.term,
      ...(currentWord.synonyms || []),
    ].map(normalizeWord);

    if (validAnswers.includes(normalizeWord(inputValue))) {
      const isFirstTry = attempts.length === 0;
      const newStreak = isFirstTry ? myStreak + 1 : 0;

      const elapsedSeconds = Math.floor((Date.now() - roundStartTime) / 1000);
      const timeLeft = Math.max(0, 15 - elapsedSeconds);

      const basePoints = WIN_BASE_POINTS + timeLeft * 5;
      const points = Math.round(basePoints * getMultiplier(newStreak));

      setMyStreak(newStreak);

      setMyRoundPoints(points);
      myRoundPointsRef.current = points;

      setMyScore((prev) => prev + points);

      channel.send({
        type: 'broadcast',
        event: 'word-finished',
        payload: {
          status: 'found',
          points,
          index: currentWordIndexRef.current,
          streak: newStreak,
        },
      });

      updateMyStatus('found');
    } else {
      setAttempts((prev) => [...prev, inputValue]);
      setInputValue('');
      setMyStreak(0);
      setIsLocked(true);
    }
  };

  return {
    state: {
      currentWord,
      currentWordIndex,
      roundState,
      myStatus,
      opponentStatus,
      myScore,
      opponentScore,
      myRoundPoints,
      opponentRoundPoints,
      myStreak,
      opponentStreak,
      isLocked,
      inputValue,
      matchHistory,
    },
    actions: {
      setInputValue,
      handleSubmit,
      handleSkip,
      handleSurrender,
    },
  };
};
