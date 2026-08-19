import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import prisma from '@/lib/prisma';
import { sendSessionReminder } from '@/lib/push/push-service';
import { endOfDay } from 'date-fns';

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
 *    - Compte les cartes dues pour aujourd'hui (Card.due <= endOfDay(now)).
 *    - Si count > 0 → envoie la notification de rappel.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const limitDate = endOfDay(now);
  const results = { sent: 0, skipped: 0, errors: 0 };

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
          select: {
            languageId: true,
          },
        },
        notificationPreference: {
          select: {
            sessionReminderLanguages: true,
          },
        },
      },
    });

    await Promise.allSettled(
      eligibleUsers.map(async (user) => {
        const allowedLanguageIds =
          user.notificationPreference?.sessionReminderLanguages ?? [];

        // Langues à traiter : toutes si la liste est vide, sinon intersection
        const languagesToCheck =
          allowedLanguageIds.length === 0
            ? user.learningLanguages.map((ul) => ul.languageId)
            : user.learningLanguages
                .map((ul) => ul.languageId)
                .filter((id) => allowedLanguageIds.includes(id));

        await Promise.allSettled(
          languagesToCheck.map(async (languageId) => {
            try {
              // Compte les cartes dues pour aujourd'hui dans cette langue
              const dueCount = await prisma.card.count({
                where: {
                  ownerId: user.id,
                  languageId,
                  due: { lte: limitDate },
                  word: { isDeleted: false, deleteToken: BigInt(0) },
                  // state 0 = New, 1 = Learning, 2 = Review, 3 = Relearning
                  // Toutes les cartes arrivées à échéance sont concernées
                },
              });

              if (dueCount > 0) {
                await sendSessionReminder(user.id, languageId, dueCount);
                results.sent++;
              } else {
                results.skipped++;
              }
            } catch (err) {
              console.error(
                `[Cron] Erreur pour user=${user.id} lang=${languageId}:`,
                err,
              );
              results.errors++;
            }
          }),
        );
      }),
    );

    console.log('[Cron] session-reminder terminé :', results);

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('[Cron] Erreur générale session-reminder :', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
