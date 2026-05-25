'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './ToastProvider';
import { Swords } from 'lucide-react';
import { useUser } from './UserProvider';
import { toDisplayName } from '@/lib/words/community';

type PresenceContextValue = {
  onlineUserIds: Set<string>;
  currentUserId: string | null;
  sendChallenge: (targetUserId: string, languageId: string) => void;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

const PRESENCE_CHANNEL = 'lugva-global-presence';

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const router = useRouter();
  const toast = useToast();

  const { user: currentUserProfile } = useUser();

  useEffect(() => {
    const supabase = createClient();
    let isCancelled = false;

    const syncPresence = () => {
      if (!channelRef.current) return;
      const states = channelRef.current.presenceState<{ userId: string }>();
      const keys = Object.keys(states);
      setOnlineUserIds(new Set(keys));
    };

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || isCancelled) return;
      setCurrentUserId(user.id);

      const channel = supabase.channel(PRESENCE_CHANNEL, {
        config: { presence: { key: user.id } },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, syncPresence)
        .on('presence', { event: 'join' }, syncPresence)
        .on('presence', { event: 'leave' }, syncPresence)
        .on('broadcast', { event: 'duel-invite' }, (payload) => {
          if (payload.payload.targetUserId === user.id) {
            const { challengerId, challengerName, roomId, languageId } =
              payload.payload;

            const challengeMessage = (
              <span className="flex items-center gap-2">
                <Swords className="text-primary inline-block h-4.5 w-4.5" />
                <span>
                  <b>{challengerName || 'Un joueur'}</b>
                  {' vous demande en duel !'}
                </span>
              </span>
            );

            toast.challenge(
              challengeMessage,
              () => {
                channel.send({
                  type: 'broadcast',
                  event: 'duel-response',
                  payload: {
                    targetUserId: challengerId,
                    accepted: true,
                    roomId,
                    languageId,
                  },
                });
                router.push(`/duel/${roomId}?lang=${languageId}`);
              },
              () => {
                channel.send({
                  type: 'broadcast',
                  event: 'duel-response',
                  payload: { targetUserId: challengerId, accepted: false },
                });
              },
            );
          }
        })
        .on('broadcast', { event: 'duel-response' }, (payload) => {
          if (payload.payload.targetUserId === user.id) {
            if (payload.payload.accepted) {
              toast.success("Défi accepté ! Préparation de l'arène...");
              router.push(
                `/duel/${payload.payload.roomId}?lang=${payload.payload.languageId}`,
              );
            } else {
              toast.error('Votre adversaire a refusé ou esquivé le défi.');
            }
          }
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED' || !channel || isCancelled) return;
          await channel.track({ userId: user.id, at: Date.now() });
          syncPresence();
        });
    };

    bootstrap();

    return () => {
      isCancelled = true;
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [router, toast]);

  const sendChallenge = useCallback(
    (targetUserId: string, languageId: string) => {
      if (!channelRef.current || !currentUserId || !currentUserProfile) return;

      const roomId = `room_${currentUserId}_${Date.now()}`;

      const challengerName = toDisplayName(
        currentUserProfile.email,
        currentUserProfile.id,
        currentUserProfile.username,
      );

      channelRef.current.send({
        type: 'broadcast',
        event: 'duel-invite',
        payload: {
          targetUserId,
          challengerId: currentUserId,
          challengerName,
          roomId,
          languageId,
        },
      });

      toast.info('Défi envoyé ! En attente de la réponse...');
    },
    [currentUserId, currentUserProfile, toast],
  );

  const value = useMemo(
    () => ({ onlineUserIds, currentUserId, sendChallenge }),
    [currentUserId, onlineUserIds, sendChallenge],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context)
    throw new Error('usePresence must be used within PresenceProvider');
  return context;
};
