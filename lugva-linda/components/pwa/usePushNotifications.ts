'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  isPushSupported,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  serializePushSubscription,
} from '@/lib/push/push-client';
import {
  subscribePushAction,
  unsubscribePushAction,
} from '@/actions/push-actions';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export type UsePushNotificationsReturn = {
  /** L'appareil supporte-t-il les push notifications ? */
  isSupported: boolean;
  /** L'utilisateur est-il actuellement souscrit ? */
  isSubscribed: boolean;
  /** État de la permission système (`Notification.permission`) */
  permission: PushPermissionState;
  /** Une opération async est-elle en cours ? */
  isPending: boolean;
  /** Demande la permission et souscrit l'appareil */
  subscribe: () => Promise<void>;
  /** Désabonne l'appareil courant */
  unsubscribe: () => Promise<void>;
  /** Message d'erreur de la dernière opération */
  error: string | null;
};

/**
 * Hook React encapsulant le cycle de vie des notifications push.
 *
 * Gère la détection de compatibilité, la demande de permission,
 * la souscription/désabonnement et la persistance en base via Server Actions.
 *
 * Compatible Android (Chrome/Firefox) et iOS Safari PWA (≥ 16.4, installée en A2HS).
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] =
    useState<PushPermissionState>('default');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSupported = isPushSupported();
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    getCurrentPushSubscription().then((sub) => {
      setIsSubscribed(sub !== null);
    });
  }, [isSupported]);
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError(
        "Les notifications push ne sont pas supportées sur cet appareil. " +
          "Sur iOS, installez l'application sur votre écran d'accueil.",
      );
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await Notification.requestPermission();
        setPermission(result as PushPermissionState);

        if (result !== 'granted') {
          setError(
            result === 'denied'
              ? 'Permission refusée. Activez les notifications dans les réglages de votre navigateur.'
              : 'Permission non accordée.',
          );
          return;
        }

        const pushSub = await subscribeToPush();
        const serialized = serializePushSubscription(pushSub);

        await subscribePushAction(serialized);

        setIsSubscribed(true);
      } catch (err) {
        console.error('[Push] Erreur lors de la souscription :', err);
        setError(
          "Impossible d'activer les notifications. Vérifiez que l'application est installée sur votre écran d'accueil (iOS).",
        );
      }
    });
  }, [isSupported]);
  const unsubscribe = useCallback(async () => {
    setError(null);

    startTransition(async () => {
      try {
        const currentSub = await getCurrentPushSubscription();
        const endpoint = currentSub?.endpoint;

        await unsubscribeFromPush();

        if (endpoint) {
          await unsubscribePushAction(endpoint);
        }

        setIsSubscribed(false);
      } catch (err) {
        console.error('[Push] Erreur lors du désabonnement :', err);
        setError('Impossible de désactiver les notifications.');
      }
    });
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isPending,
    subscribe,
    unsubscribe,
    error,
  };
}
