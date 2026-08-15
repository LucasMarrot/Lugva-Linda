-- AlterTable: Rename wasPlanned → hadDueCards (data-preserving)
ALTER TABLE "DailyStat" RENAME COLUMN "wasPlanned" TO "hadDueCards";

-- DropIndex (old index)
DROP INDEX IF EXISTS "DailyStat_ownerId_languageId_idx";

-- CreateIndex (new composite index with date for range queries)
CREATE INDEX "DailyStat_ownerId_languageId_date_idx" ON "DailyStat"("ownerId", "languageId", "date");
