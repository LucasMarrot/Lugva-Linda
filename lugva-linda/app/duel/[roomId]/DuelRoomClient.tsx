'use client';

import { useEffect, useState, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Swords, Play, Users } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { DuelWord, generateDuelDeck } from '@/actions/duel-actions';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui';
import { SessionHeader } from '@/components/review/SessionHeader';
import { DuelArena } from './DuelArena';

type PresenceData = {
  name?: string;
  color?: string;
};

type DuelRoomClientProps = {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
  challengerId: string;
  languageId: string;
  languageName?: string;
};

export const DuelRoomClient = ({
  roomId,
  currentUserId,
  currentUserName,
  currentUserColor,
  challengerId,
  languageId,
  languageName = 'ERREUR',
}: DuelRoomClientProps) => {
  const router = useRouter();
  const toast = useToast();

  const [deck, setDeck] = useState<DuelWord[] | null>(null);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);

  const [opponentName, setOpponentName] = useState<string>('Adversaire');
  const [opponentColor, setOpponentColor] = useState<string>('#3B82F6');

  const [gameStarted, setGameStarted] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const isGeneratingRef = useRef(false);
  const isChallenger = currentUserId === challengerId;

  useEffect(() => {
    const supabase = createClient();
    const newChannel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: currentUserId } },
    });

    newChannel.on('presence', { event: 'sync' }, () => {
      const state = newChannel.presenceState();
      const userIdsInRoom = Object.keys(state);

      const opponentIds = userIdsInRoom.filter((id) => id !== currentUserId);
      if (opponentIds.length > 0) {
        setOpponentJoined(true);
        setOpponentId(opponentIds[0]);

        const oppData = state[opponentIds[0]][0] as PresenceData;
        if (oppData) {
          if (oppData.name) setOpponentName(oppData.name);
          if (oppData.color) setOpponentColor(oppData.color);
        }
      }
    });

    newChannel.on('broadcast', { event: 'share-deck' }, (payload) => {
      if (!isChallenger) setDeck(payload.payload.deck);
    });

    newChannel.on('broadcast', { event: 'start-game' }, () => {
      setGameStarted(true);
    });

    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await newChannel.track({
          online_at: new Date().toISOString(),
          name: currentUserName,
          color: currentUserColor,
        });
        setChannel(newChannel);
      }
    });

    return () => {
      newChannel.untrack();
      supabase.removeChannel(newChannel);
    };
  }, [roomId, currentUserId, isChallenger, currentUserName, currentUserColor]);

  useEffect(() => {
    if (
      isChallenger &&
      opponentJoined &&
      !deck &&
      !isGeneratingRef.current &&
      channel
    ) {
      isGeneratingRef.current = true;
      const initDeck = async () => {
        try {
          const state = channel.presenceState();
          const targetId = Object.keys(state || {}).find(
            (id) => id !== challengerId,
          );
          if (!targetId) {
            toast.error('Adversaire introuvable.');
            isGeneratingRef.current = false;
            return;
          }
          const generatedDeck = await generateDuelDeck(
            challengerId,
            targetId,
            languageId,
          );
          setDeck(generatedDeck);
          channel.send({
            type: 'broadcast',
            event: 'share-deck',
            payload: { deck: generatedDeck },
          });
        } catch (error) {
          console.error('Erreur lors de la génération du deck :', error);
          toast.error('Erreur lors de la création du deck.');
          isGeneratingRef.current = false;
        }
      };
      initDeck();
    }
  }, [
    isChallenger,
    opponentJoined,
    deck,
    challengerId,
    languageId,
    toast,
    channel,
  ]);

  const handleStartGame = () => {
    if (isChallenger && channel) {
      channel.send({ type: 'broadcast', event: 'start-game' });
      setGameStarted(true);
    }
  };

  if (gameStarted && deck && opponentId && channel) {
    return (
      <DuelArena
        deck={deck}
        channel={channel}
        currentUserId={currentUserId}
        opponentId={opponentId}
        languageName={languageName}
        currentUserName={currentUserName}
        currentUserColor={currentUserColor}
        opponentName={opponentName}
        opponentColor={opponentColor}
      />
    );
  }

  return (
    <div className="bg-background text-foreground flex min-h-[calc(100dvh-4rem)] w-full flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-between p-4 text-center">
        <SessionHeader
          languageName={languageName}
          onQuit={() => router.push('/')}
        />

        <div className="animate-in fade-in zoom-in mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-8 duration-500">
          <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <Swords className="text-primary h-10 w-10" />
          </div>

          <h1 className="mb-2 text-3xl font-bold">Prêt pour le duel ?</h1>
          <p className="text-muted-foreground mb-8 px-4">
            {opponentJoined
              ? "L'adversaire est prêt. En attente du lancement..."
              : 'En attente de la connexion de votre adversaire...'}
          </p>

          <div className="mb-8 grid w-full grid-cols-2 gap-4">
            <div className="bg-card border-border flex h-28 flex-col items-center justify-center rounded-xl border p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <Users
                  className="h-5 w-5"
                  style={{
                    color: opponentJoined
                      ? opponentColor
                      : 'var(--muted-foreground)',
                  }}
                />
                <span
                  className="text-xl font-bold"
                  style={{
                    color: opponentJoined
                      ? opponentColor
                      : 'var(--muted-foreground)',
                  }}
                >
                  {opponentJoined ? opponentName : 'En attente'}
                </span>
              </div>
              <span className="text-muted-foreground text-sm">Adversaire</span>
            </div>

            <div className="bg-card border-border flex h-28 flex-col items-center justify-center rounded-xl border p-4 shadow-sm">
              <span className="text-primary mb-1 text-2xl font-bold">
                Écriture
              </span>
              <span className="text-muted-foreground text-sm">
                {"Type d'exercice"}
              </span>
            </div>
          </div>

          {isChallenger ? (
            <Button
              size="lg"
              className="h-14 w-full gap-2 rounded-xl text-lg"
              onClick={handleStartGame}
              disabled={!opponentJoined || !deck}
            >
              <Play className="h-5 w-5 fill-current" /> Commencer le duel
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="h-14 w-full gap-2 rounded-xl text-lg"
              disabled
            >
              <Play className="h-5 w-5 fill-current opacity-50" /> Attente du
              challenger...
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
