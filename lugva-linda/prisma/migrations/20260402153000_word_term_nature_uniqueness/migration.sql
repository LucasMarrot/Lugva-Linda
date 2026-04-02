ALTER TABLE "Word"
ADD COLUMN "mandatoryTag" TEXT;

UPDATE "Word"
SET
  "mandatoryTag" = CASE
    WHEN 'Nom' = ANY("tags") THEN 'Nom'
    WHEN 'Verbe' = ANY("tags") THEN 'Verbe'
    WHEN 'Adjectif' = ANY("tags") THEN 'Adjectif'
    WHEN 'Adverbe' = ANY("tags") THEN 'Adverbe'
    WHEN 'Expression' = ANY("tags") THEN 'Expression'
    ELSE 'Nom'
  END,
  "tags" = CASE
    WHEN "tags" && ARRAY['Nom', 'Verbe', 'Adjectif', 'Adverbe', 'Expression']::TEXT[]
      THEN "tags"
    ELSE array_prepend('Nom', "tags")
  END;

ALTER TABLE "Word"
ALTER COLUMN "mandatoryTag" SET NOT NULL;

DROP INDEX IF EXISTS "Word_ownerId_languageId_termNormalized_deleteToken_key";

CREATE UNIQUE INDEX "Word_ownerId_languageId_termNormalized_mandatoryTag_deleteToken_key"
ON "Word"("ownerId", "languageId", "termNormalized", "mandatoryTag", "deleteToken");

CREATE INDEX IF NOT EXISTS "Word_ownerId_languageId_isDeleted_termNormalized_mandatoryTag_idx"
ON "Word"("ownerId", "languageId", "isDeleted", "termNormalized", "mandatoryTag");
