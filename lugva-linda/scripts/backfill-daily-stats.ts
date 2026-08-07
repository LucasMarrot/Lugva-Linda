// Ce script doit être exécuté avec : npx tsx --env-file=.env scripts/backfill-daily-stats.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  format,
  startOfDay,
  subDays,
  eachDayOfInterval,
  endOfDay,
} from 'date-fns';
import { FEATURE_EPOCH } from '../lib/constants';

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function rebuild() {
  console.log('🔄 REBUILD hadDueCards — Stratégie card.due uniquement\n');

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

  // 1. Récupérer tous les user-language
  const userLanguages = await prisma.userLanguage.findMany({
    select: { userId: true, languageId: true, createdAt: true },
  });

  console.log(`${userLanguages.length} paire(s) user-language à traiter.\n`);

  let totalFixed = 0;

  for (const ul of userLanguages) {
    let epochStr = format(ul.createdAt, 'yyyy-MM-dd');
    if (epochStr < FEATURE_EPOCH) epochStr = FEATURE_EPOCH;
    if (epochStr > yesterdayStr) continue;

    // 2. RESET : Mettre hadDueCards=false pour TOUS les DailyStat sans completedCards
    const resetResult = await prisma.dailyStat.updateMany({
      where: {
        ownerId: ul.userId,
        languageId: ul.languageId,
        date: { gte: epochStr, lte: yesterdayStr },
        completedCards: 0,
        hadDueCards: true,
      },
      data: { hadDueCards: false },
    });

    if (resetResult.count > 0) {
      console.log(`  ♻️  ${ul.userId.substring(0, 8)}/${ul.languageId.substring(0, 8)} — Reset ${resetResult.count} jour(s)`);
    }

    // 3. Marquer hadDueCards=true pour les jours où on a révisé
    await prisma.dailyStat.updateMany({
      where: {
        ownerId: ul.userId,
        languageId: ul.languageId,
        completedCards: { gt: 0 },
      },
      data: { hadDueCards: true },
    });

    // 4. Recalculer les jours manqués via card.due UNIQUEMENT
    // Récupérer les cartes actuellement en retard (due <= hier)
    const overdueCards = await prisma.card.findMany({
      where: {
        ownerId: ul.userId,
        languageId: ul.languageId,
        due: { lte: endOfDay(yesterday) },
        state: { not: 0 },
        word: { isDeleted: false },
      },
      select: { due: true },
    });

    if (overdueCards.length === 0) {
      console.log(`  ✅ ${ul.userId.substring(0, 8)}/${ul.languageId.substring(0, 8)} — Aucune carte en retard`);
      continue;
    }

    // Pour chaque jour non couvert, vérifier si des cartes étaient dues
    const existingStats = await prisma.dailyStat.findMany({
      where: {
        ownerId: ul.userId,
        languageId: ul.languageId,
        date: { gte: epochStr, lte: yesterdayStr },
      },
      select: { date: true, completedCards: true },
    });

    const coveredDays = new Set(existingStats.filter(s => s.completedCards > 0).map(s => s.date));
    const epochDate = startOfDay(new Date(epochStr + 'T00:00:00'));
    const allDays = eachDayOfInterval({ start: epochDate, end: yesterday });

    const daysToMark: string[] = [];

    for (const day of allDays) {
      const dayStr = format(day, 'yyyy-MM-dd');
      if (coveredDays.has(dayStr)) continue; // Déjà vert

      const dayEnd = endOfDay(day);
      const hasDue = overdueCards.some(c => c.due <= dayEnd);

      if (hasDue) {
        daysToMark.push(dayStr);
      }
    }

    if (daysToMark.length > 0) {
      const upserts = daysToMark.map((dateStr) =>
        prisma.dailyStat.upsert({
          where: {
            ownerId_languageId_date: {
              ownerId: ul.userId,
              languageId: ul.languageId,
              date: dateStr,
            },
          },
          create: {
            ownerId: ul.userId,
            languageId: ul.languageId,
            date: dateStr,
            hadDueCards: true,
          },
          update: { hadDueCards: true },
        }),
      );

      const BATCH_SIZE = 50;
      for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        await prisma.$transaction(upserts.slice(i, i + BATCH_SIZE));
      }
    }

    totalFixed += daysToMark.length;
    console.log(
      `  ✅ ${ul.userId.substring(0, 8)}/${ul.languageId.substring(0, 8)} — ${daysToMark.length} jour(s) manqués (cartes actuellement en retard)`
    );
  }

  console.log(`\n🎉 Rebuild terminé. ${totalFixed} jour(s) marqués.`);
}

rebuild()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
