import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import prisma from '@/lib/prisma';
import webpush from 'web-push';
import { endOfDay } from 'date-fns';
import type { NotificationPayload } from '@/types/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Route API Cron — Rappels de séance quotidiens.
 *
 * Déclenchée chaque jour à 8h UTC par Vercel Cron (vercel.json).
 * Protégée par le header `Authorization: Bearer <CRON_SECRET>`.
 *
 * Logique :
 * 1. Récupère tous les USER ayant des notifications de séance activées
 *    et au moins une souscription push active.
 * 2. Pour chaque utilisateur et chaque langue éligible :
 *    - Compte les cartes dues pour aujourd'hui via `isWordDeleted`.
 *    - Si count > 0 → envoie la notification de rappel.
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    console.warn('[Cron] session-reminder — tentative non autorisée rejetée');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const limitDate = endOfDay(now);

  console.log(`[Cron] Démarrage session-reminder — ${now.toISOString()}`);

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );

  try {
    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        notificationPreference: {
          sessionReminderEnabled: true,
        },
        pushSubscriptions: {
          some: {}, // au moins une souscription active
        },
      },
      select: {
        id: true,
        learningLanguages: {
          select: { languageId: true },
        },
        notificationPreference: {
          select: {
            sessionReminderEnabled: true,
            sessionReminderLanguages: true,
          },
        },
        pushSubscriptions: {
          select: {
            endpoint: true,
            p256dh: true,
            auth: true,
          },
        },
      },
    });

    console.log(
      `[Cron] ${eligibleUsers.length} utilisateur(s) éligible(s) trouvé(s)`,
    );

    const batchResults = await Promise.allSettled(
      eligibleUsers.map(async (user) => {
        const localResults = { sent: 0, skipped: 0, errors: 0 };

        const prefs = user.notificationPreference;

        if (!prefs?.sessionReminderEnabled) return localResults;

        const allowedLanguageIds = prefs.sessionReminderLanguages ?? [];
        const languagesToCheck =
          allowedLanguageIds.length === 0
            ? user.learningLanguages.map((ul) => ul.languageId)
            : user.learningLanguages
                .map((ul) => ul.languageId)
                .filter((id) => allowedLanguageIds.includes(id));

        const langResults = await Promise.allSettled(
          languagesToCheck.map(async (languageId) => {
            try {
              const dueCount = await prisma.card.count({
                where: {
                  ownerId: user.id,
                  languageId,
                  due: { lte: limitDate },
                  isWordDeleted: false,
                },
              });

              if (dueCount === 0) {
                return { status: 'skipped' as const };
              }

              const language = await prisma.language.findUnique({
                where: { id: languageId },
                select: { name: true },
              });

              if (!language) {
                console.warn(
                  `[Cron] Langue inconnue : ${languageId} (user=${user.id})`,
                );
                return { status: 'skipped' as const };
              }

              const payload: NotificationPayload = {
                type: 'SESSION_REMINDER',
                languageId,
                languageName: language.name,
                exerciseCount: dueCount,
              };

              const serializedPayload = JSON.stringify(payload);
              const expiredEndpoints: string[] = [];

              await Promise.allSettled(
                user.pushSubscriptions.map(async (sub) => {
                  try {
                    await webpush.sendNotification(
                      {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                      },
                      serializedPayload,
                      { TTL: 86400 },
                    );
                  } catch (err: unknown) {
                    if (
                      err &&
                      typeof err === 'object' &&
                      'statusCode' in err &&
                      (err as { statusCode: number }).statusCode === 410
                    ) {
                      expiredEndpoints.push(sub.endpoint);
                    } else {
                      console.error(
                        `[Cron] Échec push pour user=${user.id} lang=${languageId}:`,
                        err,
                      );
                    }
                  }
                }),
              );

              // Nettoyage asynchrone des souscriptions expirées (non bloquant)
              if (expiredEndpoints.length > 0) {
                await prisma.pushSubscription.deleteMany({
                  where: { endpoint: { in: expiredEndpoints } },
                });
                console.log(
                  `[Cron] ${expiredEndpoints.length} souscription(s) expirée(s) supprimée(s) pour user=${user.id}`,
                );
              }

              return { status: 'sent' as const };
            } catch (err) {
              console.error(
                `[Cron] Erreur pour user=${user.id} lang=${languageId}:`,
                err,
              );
              return { status: 'error' as const };
            }
          }),
        );

        // Agrégation des résultats de cette langue
        for (const r of langResults) {
          if (r.status === 'fulfilled') {
            if (r.value.status === 'sent') localResults.sent++;
            else if (r.value.status === 'skipped') localResults.skipped++;
            else localResults.errors++;
          } else {
            localResults.errors++;
          }
        }

        return localResults;
      }),
    );

    const totals = { sent: 0, skipped: 0, errors: 0 };

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        totals.sent += r.value.sent;
        totals.skipped += r.value.skipped;
        totals.errors += r.value.errors;
      } else {
        totals.errors++;
        console.error(
          '[Cron] Erreur inattendue dans le batch utilisateur :',
          r.reason,
        );
      }
    }

    const durationMs = Date.now() - startedAt;

    console.log(`[Cron] session-reminder terminé en ${durationMs}ms :`, totals);

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      durationMs,
      ...totals,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(
      `[Cron] Erreur générale session-reminder (après ${durationMs}ms) :`,
      error,
    );
    return NextResponse.json(
      { ok: false, error: 'Internal server error', durationMs },
      { status: 500 },
    );
  }
}
