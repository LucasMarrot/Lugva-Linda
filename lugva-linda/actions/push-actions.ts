'use server';

import prisma from '@/lib/prisma';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import {
  logActionError,
  logActionSuccess,
  toActionError,
} from '@/lib/actions/action-error';
import { assertRateLimit } from '@/lib/security/rate-limit';
import { assertCsrfForAction } from '@/lib/security/csrf';
import type {
  SerializedPushSubscription,
  NotificationPreferences,
} from '@/types/notifications';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications';
import { z } from 'zod';

// ─── Schémas de validation ────────────────────────────────────────────────────

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().max(512).optional(),
});

const learnerPrefsSchema = z.object({
  sessionReminderEnabled: z.boolean(),
  sessionReminderLanguages: z.array(z.string().uuid()),
  wordCompletedEnabled: z.boolean(),
});

const contributorPrefsSchema = z.object({
  wordAssignedEnabled: z.boolean(),
});

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Enregistre ou met à jour la souscription push de l'appareil courant.
 * Crée également un enregistrement de préférences par défaut si nécessaire.
 */
export async function subscribePushAction(
  subscription: SerializedPushSubscription,
) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    await assertCsrfForAction({ subject: user.id });
    assertRateLimit(`push-subscribe:${user.id}`, 20, 60_000);

    const parsed = subscriptionSchema.parse(subscription);

    // Upsert de la souscription (une entrée par endpoint)
    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.endpoint },
      create: {
        userId: user.id,
        endpoint: parsed.endpoint,
        p256dh: parsed.p256dh,
        auth: parsed.auth,
        userAgent: parsed.userAgent,
      },
      update: {
        userId: user.id,
        p256dh: parsed.p256dh,
        auth: parsed.auth,
        userAgent: parsed.userAgent,
      },
    });

    // Création des préférences par défaut si c'est la première souscription
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      },
      update: {},
    });

    logActionSuccess('subscribePushAction', userId, startedAt);
  } catch (error) {
    logActionError('subscribePushAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

/**
 * Supprime la souscription push de l'appareil courant (désabonnement).
 */
export async function unsubscribePushAction(endpoint: string) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    await assertCsrfForAction({ subject: user.id });
    assertRateLimit(`push-unsubscribe:${user.id}`, 20, 60_000);

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        endpoint,
      },
    });

    logActionSuccess('unsubscribePushAction', userId, startedAt);
  } catch (error) {
    logActionError('unsubscribePushAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

/**
 * Met à jour les préférences de notification de l'utilisateur courant.
 *
 * Filtrage par rôle :
 * - USER    → peut modifier sessionReminderEnabled, sessionReminderLanguages, wordCompletedEnabled
 * - CONTRIBUTOR → peut modifier uniquement wordAssignedEnabled
 */
export async function updateNotificationPrefsAction(
  prefs: Partial<NotificationPreferences>,
) {
  let userId: string | null = null;
  const startedAt = Date.now();

  try {
    const user = await requireAuthenticatedUser();
    userId = user.id;

    await assertCsrfForAction({ subject: user.id });
    assertRateLimit(`push-prefs:${user.id}`, 30, 60_000);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser) throw new Error('Utilisateur introuvable.');

    let updateData: Partial<{
      sessionReminderEnabled: boolean;
      sessionReminderLanguages: string[];
      wordCompletedEnabled: boolean;
      wordAssignedEnabled: boolean;
    }> = {};

    if (dbUser.role === 'CONTRIBUTOR') {
      const parsed = contributorPrefsSchema.parse({
        wordAssignedEnabled: prefs.wordAssignedEnabled,
      });
      updateData = parsed;
    } else {
      const parsed = learnerPrefsSchema.parse({
        sessionReminderEnabled: prefs.sessionReminderEnabled,
        sessionReminderLanguages: prefs.sessionReminderLanguages ?? [],
        wordCompletedEnabled: prefs.wordCompletedEnabled,
      });
      updateData = parsed;
    }

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...updateData,
      },
      update: updateData,
    });

    logActionSuccess('updateNotificationPrefsAction', userId, startedAt);
  } catch (error) {
    logActionError('updateNotificationPrefsAction', userId, error, startedAt);
    throw toActionError(error);
  }
}

/**
 * Retourne les préférences de notification et l'état de souscription de l'utilisateur courant.
 */
export async function getNotificationPrefsAction(): Promise<{
  prefs: NotificationPreferences;
  hasActiveSubscription: boolean;
}> {
  const user = await requireAuthenticatedUser();

  const [prefs, subCount] = await Promise.all([
    prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    }),
    prisma.pushSubscription.count({
      where: { userId: user.id },
    }),
  ]);

  return {
    prefs: prefs
      ? {
          sessionReminderEnabled: prefs.sessionReminderEnabled,
          sessionReminderLanguages: prefs.sessionReminderLanguages,
          wordCompletedEnabled: prefs.wordCompletedEnabled,
          wordAssignedEnabled: prefs.wordAssignedEnabled,
        }
      : { ...DEFAULT_NOTIFICATION_PREFERENCES },
    hasActiveSubscription: subCount > 0,
  };
}
