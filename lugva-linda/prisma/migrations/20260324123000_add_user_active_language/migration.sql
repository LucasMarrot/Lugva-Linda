-- AlterTable
ALTER TABLE "User"
ADD COLUMN "activeLanguageId" TEXT;

-- CreateIndex
CREATE INDEX "User_activeLanguageId_idx" ON "User"("activeLanguageId");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_activeLanguageId_fkey"
FOREIGN KEY ("activeLanguageId") REFERENCES "Language"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
