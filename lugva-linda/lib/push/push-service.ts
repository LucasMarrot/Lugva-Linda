/**
 * Service d'envoi de notifications push côté serveur.
 *
 * Utilise la bibliothèque `web-push` avec le protocole VAPID.
 * Ce fichier ne doit JAMAIS être importé côté client.
 *
 * Matrice de sécurité :
 * ┌─────────────────────┬──────────────────┬───────────────────────────────────┐
 * │ Notification        │ Destinataire     │ Condition bloquante               │
 * ├─────────────────────┼──────────────────┼───────────────────────────────────┤
 * │ SESSION_REMINDER    │ USER uniquement  │ role=CONTRIBUTOR → skip           │
 * │ WORD_COMPLETED      │ USER (ownerId)   │ wordCompletedEnabled=false → skip │
 * │ WORD_ASSIGNED       │ CONTRIBUTOR(s)   │ wordAssignedEnabled=false → skip  │
 * └─────────────────────┴──────────────────┴───────────────────────────────────┘
 */

import webpush from 'web-push';
import { env } from '@/lib/env';
import prisma from '@/lib/prisma';
import type { NotificationPayload } from '@/types/notifications';
import { toDisplayName } from '@/lib/words/community';

// ─── Configuration VAPID (une seule fois au démarrage) ────────────────────────

webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

// ─── Helpers internes ─────────────────────────────────────────────────────────

/**
 * Envoie un payload push à TOUTES les souscriptions actives d'un utilisateur.
 * Supprime automatiquement les souscriptions expirées (statut HTTP 410).
 */
async function sendToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const serializedPayload = JSON.stringify(payload);
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          serializedPayload,
          { TTL: 86400 }, // TTL 24h — la notif peut être livrée en différé
        );
      } catch (error: unknown) {
        // 410 Gone = la souscription a été révoquée par le navigateur/OS
        if (
          error &&
          typeof error === 'object' &&
          'statusCode' in error &&
          (error as { statusCode: number }).statusCode === 410
        ) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error(
            `[Push] Erreur lors de l'envoi à ${sub.endpoint.slice(0, 60)}…`,
            error,
          );
        }
      }
    }),
  );

  // Nettoyage des souscriptions expirées
  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

/**
 * Envoie un rappel de séance à un apprenant pour une langue donnée.
 *
 * Règles :
 * - L'utilisateur doit avoir le rôle USER (jamais CONTRIBUTOR).
 * - sessionReminderEnabled doit être true.
 * - La langue doit être dans sessionReminderLanguages (ou la liste vide = toutes).
 * - exerciseCount doit être > 0.
 */
export async function sendSessionReminder(
  userId: string,
  languageId: string,
  exerciseCount: number,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      notificationPreference: true,
    },
  });

  // Règle absolue : les Contributeurs ne reçoivent jamais de rappel de séance
  if (!user || user.role === 'CONTRIBUTOR') return;

  const prefs = user.notificationPreference;
  if (!prefs || !prefs.sessionReminderEnabled) return;

  // Si la liste des langues est non-vide, vérifier que la langue est incluse
  if (
    prefs.sessionReminderLanguages.length > 0 &&
    !prefs.sessionReminderLanguages.includes(languageId)
  ) {
    return;
  }

  if (exerciseCount <= 0) return;

  const language = await prisma.language.findUnique({
    where: { id: languageId },
    select: { name: true },
  });

  if (!language) return;

  await sendToUser(userId, {
    type: 'SESSION_REMINDER',
    languageId,
    languageName: language.name,
    exerciseCount,
  });
}

/**
 * Notifie le propriétaire d'un mot qu'un contributeur l'a complété.
 *
 * Règles :
 * - wordCompletedEnabled doit être true chez le propriétaire.
 * - Le contributeur doit avoir un nom d'affichage.
 */
export async function sendWordCompletedNotification(
  wordId: string,
  contributorId: string,
): Promise<void> {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    select: { ownerId: true, term: true },
  });

  if (!word) return;

  const [owner, contributor] = await Promise.all([
    prisma.user.findUnique({
      where: { id: word.ownerId },
      select: { notificationPreference: true },
    }),
    prisma.user.findUnique({
      where: { id: contributorId },
      select: { id: true, email: true, username: true },
    }),
  ]);

  if (!owner?.notificationPreference?.wordCompletedEnabled) return;
  if (!contributor) return;

  const contributorName = toDisplayName(
    contributor.email,
    contributor.id,
    contributor.username,
  );

  await sendToUser(word.ownerId, {
    type: 'WORD_COMPLETED',
    wordId,
    wordTerm: word.term,
    contributorName,
  });
}

/**
 * Notifie tous les contributeurs associés à un apprenant qu'un mot leur est assigné.
 *
 * Règles :
 * - Les contributeurs ciblés sont ceux dont targetOwnerId = ownerId du mot.
 * - wordAssignedEnabled doit être true pour chaque contributeur.
 */
export async function sendWordAssignedNotification(
  wordId: string,
  learnerId: string,
): Promise<void> {
  const [word, learner] = await Promise.all([
    prisma.word.findUnique({
      where: { id: wordId },
      select: { translation: true, languageId: true },
    }),
    prisma.user.findUnique({
      where: { id: learnerId },
      select: { id: true, email: true, username: true },
    }),
  ]);

  if (!word || !learner) return;

  const language = await prisma.language.findUnique({
    where: { id: word.languageId },
    select: { name: true },
  });

  // Tous les contributeurs liés à cet apprenant
  const contributors = await prisma.user.findMany({
    where: {
      role: 'CONTRIBUTOR',
      targetOwnerId: learnerId,
    },
    select: {
      id: true,
      notificationPreference: true,
    },
  });

  if (contributors.length === 0) return;

  const learnerName = toDisplayName(learner.email, learner.id, learner.username);

  await Promise.allSettled(
    contributors
      .filter((c) => c.notificationPreference?.wordAssignedEnabled !== false)
      .map((contributor) =>
        sendToUser(contributor.id, {
          type: 'WORD_ASSIGNED',
          wordId,
          wordTranslation: word.translation,
          languageName: language?.name ?? '',
          learnerName,
        }),
      ),
  );
}
