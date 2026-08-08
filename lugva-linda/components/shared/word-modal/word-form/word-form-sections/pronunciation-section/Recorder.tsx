'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface RecorderProps {
  isRecording: boolean;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;
  errorMessage?: string | null;
}

export const Recorder = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  errorMessage,
}: RecorderProps) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number>(0);

  const onStartRef = useRef(onStartRecording);
  useEffect(() => {
    onStartRef.current = onStartRecording;
  }, [onStartRecording]);

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      onStartRef.current();
    }
  }, [countdown]);

  useEffect(() => {
    if (isRecording) {
      const start = Date.now();
      setElapsed(0);
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 250); // update frequently enough to not miss seconds
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [isRecording]);

  const handlePress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      if (countdown !== null) {
        setCountdown(null); // Cancel countdown
      } else {
        setCountdown(3);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isCountingDown = countdown !== null;

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : isCountingDown ? 'secondary' : 'outline'}
      className={cn(
        'h-12 w-full gap-2 border-dashed transition-colors',
        errorMessage &&
          'border-destructive ring-destructive/20 focus-visible:ring-destructive/30',
        isCountingDown && 'border-primary/50 text-primary',
      )}
      aria-label={
        isRecording
          ? "Arreter l'enregistrement audio"
          : 'Demarrer un enregistrement audio'
      }
      onClick={handlePress}
    >
      {isCountingDown ? (
        <>
          <span className="font-semibold tabular-nums flex items-center gap-2">Lancement dans <span className="font-bold text-2xl">{countdown}</span></span>
        </>
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4 fill-current" />
          <span className="tabular-nums">{formatTime(elapsed)}</span>
          <span className="hidden sm:inline"> — Arrêter</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" /> Enregistrer la prononciation
        </>
      )}
    </Button>
  );
};
