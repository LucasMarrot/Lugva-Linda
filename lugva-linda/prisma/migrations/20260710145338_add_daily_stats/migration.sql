-- CreateTable
CREATE TABLE "DailyStat" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "wasPlanned" BOOLEAN NOT NULL DEFAULT false,
    "completedCards" INTEGER NOT NULL DEFAULT 0,
    "readingCompleted" INTEGER NOT NULL DEFAULT 0,
    "writingCompleted" INTEGER NOT NULL DEFAULT 0,
    "pronunciationCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyStat_ownerId_languageId_idx" ON "DailyStat"("ownerId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStat_ownerId_languageId_date_key" ON "DailyStat"("ownerId", "languageId", "date");

-- AddForeignKey
ALTER TABLE "DailyStat" ADD CONSTRAINT "DailyStat_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStat" ADD CONSTRAINT "DailyStat_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
