/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,languageId,term,mandatoryTag,deleteToken]` on the table `Word` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Word_ownerId_languageId_termNormalized_mandatoryTag_deleteT_key";

-- CreateIndex
CREATE UNIQUE INDEX "Word_ownerId_languageId_term_mandatoryTag_deleteToken_key" ON "Word"("ownerId", "languageId", "term", "mandatoryTag", "deleteToken");
