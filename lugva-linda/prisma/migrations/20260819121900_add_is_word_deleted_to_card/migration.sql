-- AddColumn: isWordDeleted on Card
-- Dénormalisation pour éviter les JOINs word.isDeleted dans les requêtes critiques
ALTER TABLE "Card" ADD COLUMN "isWordDeleted" BOOLEAN NOT NULL DEFAULT false;

-- Mettre à jour les cartes dont le mot est supprimé (backfill initial)
UPDATE "Card" c
SET "isWordDeleted" = true
WHERE EXISTS (
  SELECT 1 FROM "Word" w
  WHERE w.id = c."wordId"
  AND w."isDeleted" = true
);

-- Mise à jour de l'index composé pour inclure isWordDeleted
DROP INDEX IF EXISTS "Card_ownerId_languageId_due_state_idx";
CREATE INDEX "Card_ownerId_languageId_due_state_isWordDeleted_idx"
  ON "Card"("ownerId", "languageId", "due", "state", "isWordDeleted");
