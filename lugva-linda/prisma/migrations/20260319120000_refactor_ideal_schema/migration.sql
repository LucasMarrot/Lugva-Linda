-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('READING', 'WRITING', 'PRONUNCIATION');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('RECOGNITION', 'REVERSE', 'SPELLING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "ReviewGrade" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "colorHex" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(12),
    "name" VARCHAR(64) NOT NULL,
    "nameNorm" VARCHAR(64) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLanguage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "termNormalized" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "translationNormalized" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "customAudioPath" TEXT,
    "customAudioUrl" TEXT,
    "sourceWordId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "purgeAfter" TIMESTAMP(3),
    "deleteToken" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "due" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scheduledDays" INTEGER NOT NULL DEFAULT 0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "state" INTEGER NOT NULL DEFAULT 0,
    "lastReview" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "grade" "ReviewGrade" NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "state" INTEGER NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "stability" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,
    "elapsedDays" INTEGER NOT NULL,
    "lastElapsedDays" INTEGER NOT NULL,
    "scheduledDays" INTEGER NOT NULL,

    CONSTRAINT "ReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Language_nameNorm_key" ON "Language"("nameNorm");

-- CreateIndex
CREATE INDEX "Language_createdBy_idx" ON "Language"("createdBy");

-- CreateIndex
CREATE INDEX "UserLanguage_userId_idx" ON "UserLanguage"("userId");

-- CreateIndex
CREATE INDEX "UserLanguage_languageId_idx" ON "UserLanguage"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLanguage_userId_languageId_key" ON "UserLanguage"("userId", "languageId");

-- CreateIndex
CREATE INDEX "Word_ownerId_languageId_isDeleted_createdAt_idx" ON "Word"("ownerId", "languageId", "isDeleted", "createdAt");

-- CreateIndex
CREATE INDEX "Word_ownerId_languageId_isDeleted_termNormalized_idx" ON "Word"("ownerId", "languageId", "isDeleted", "termNormalized");

-- CreateIndex
CREATE INDEX "Word_languageId_isDeleted_termNormalized_idx" ON "Word"("languageId", "isDeleted", "termNormalized");

-- CreateIndex
CREATE INDEX "Word_languageId_isDeleted_translationNormalized_idx" ON "Word"("languageId", "isDeleted", "translationNormalized");

-- CreateIndex
CREATE INDEX "Word_sourceWordId_idx" ON "Word"("sourceWordId");

-- CreateIndex
CREATE INDEX "Word_isDeleted_purgeAfter_idx" ON "Word"("isDeleted", "purgeAfter");

-- CreateIndex
CREATE UNIQUE INDEX "Word_id_ownerId_languageId_key" ON "Word"("id", "ownerId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "Word_ownerId_languageId_termNormalized_deleteToken_key" ON "Word"("ownerId", "languageId", "termNormalized", "deleteToken");

-- CreateIndex
CREATE INDEX "Card_ownerId_languageId_due_state_idx" ON "Card"("ownerId", "languageId", "due", "state");

-- CreateIndex
CREATE INDEX "Card_ownerId_due_state_idx" ON "Card"("ownerId", "due", "state");

-- CreateIndex
CREATE INDEX "Card_languageId_due_idx" ON "Card"("languageId", "due");

-- CreateIndex
CREATE UNIQUE INDEX "Card_wordId_type_key" ON "Card"("wordId", "type");

-- CreateIndex
CREATE INDEX "ReviewLog_cardId_reviewDate_idx" ON "ReviewLog"("cardId", "reviewDate");

-- CreateIndex
CREATE INDEX "ReviewLog_ownerId_reviewDate_idx" ON "ReviewLog"("ownerId", "reviewDate");

-- CreateIndex
CREATE INDEX "ReviewLog_ownerId_languageId_reviewDate_idx" ON "ReviewLog"("ownerId", "languageId", "reviewDate");

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLanguage" ADD CONSTRAINT "UserLanguage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLanguage" ADD CONSTRAINT "UserLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_sourceWordId_fkey" FOREIGN KEY ("sourceWordId") REFERENCES "Word"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_wordId_ownerId_languageId_fkey" FOREIGN KEY ("wordId", "ownerId", "languageId") REFERENCES "Word"("id", "ownerId", "languageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLog" ADD CONSTRAINT "ReviewLog_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
