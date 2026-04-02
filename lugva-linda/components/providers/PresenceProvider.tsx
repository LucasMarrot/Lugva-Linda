'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type PresenceContextValue = {
  onlineUserIds: Set<string>;
  currentUserId: string | null;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

const PRESENCE_CHANNEL = 'lugva-global-presence';

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isCancelled = false;
    let channel: RealtimeChannel | null = null;

    const syncPresence = () => {
      if (!channel) return;

      const states = channel.presenceState<{ userId: string }>();
      const keys = Object.keys(states);
      setOnlineUserIds(new Set(keys));
    };

    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || isCancelled) {
        return;
      }

      setCurrentUserId(user.id);

      channel = supabase.channel(PRESENCE_CHANNEL, {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, syncPresence)
        .on('presence', { event: 'join' }, syncPresence)
        .on('presence', { event: 'leave' }, syncPresence)
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED' || !channel || isCancelled) {
            return;
          }

          await channel.track({
            userId: user.id,
            at: Date.now(),
          });

          syncPresence();
        });
    };

    bootstrap();

    return () => {
      isCancelled = true;
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      onlineUserIds,
      currentUserId,
    }),
    [currentUserId, onlineUserIds],
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
