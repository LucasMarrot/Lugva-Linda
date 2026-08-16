'use client';

import { Bell, BellOff, Loader2, AlertCircle } from 'lucide-react';
import type { PushPermissionState } from '@/components/pwa/usePushNotifications';

type PushSubscriptionBannerProps = {
  isSupported: boolean;
  effectivelySubscribed: boolean;
  isPending: boolean;
  permission: PushPermissionState;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
};

export function PushSubscriptionBanner({
  isSupported,
  effectivelySubscribed,
  isPending,
  permission,
  error,
  subscribe,
  unsubscribe,
}: PushSubscriptionBannerProps) {
  return (
    <div className="border-border bg-muted/30 flex items-start justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">
          {effectivelySubscribed
            ? 'Notifications activées'
            : 'Activer les notifications push'}
        </p>
        <p className="text-muted-foreground text-xs">
          {!isSupported
            ? "Non supporté — installez l'application sur votre écran d'accueil (iOS)."
            : permission === 'denied'
              ? 'Permission refusée. Modifiez les réglages de votre navigateur.'
              : effectivelySubscribed
                ? 'Cet appareil recevra les notifications configurées ci-dessous.'
                : 'Autorisez les notifications pour recevoir les rappels et alertes.'}
        </p>
        {error && (
          <p className="text-destructive flex items-center gap-1 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {isPending ? (
        <Loader2 className="text-muted-foreground mt-0.5 h-5 w-5 animate-spin shrink-0" />
      ) : effectivelySubscribed ? (
        <button
          onClick={unsubscribe}
          disabled={isPending}
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 text-xs transition-colors"
        >
          <BellOff className="h-4 w-4" />
          Désactiver
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={!isSupported || isPending || permission === 'denied'}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Bell className="h-4 w-4" />
          Activer
        </button>
      )}
    </div>
  );
}
