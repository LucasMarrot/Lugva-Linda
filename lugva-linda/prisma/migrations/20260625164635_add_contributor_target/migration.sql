-- AlterTable
ALTER TABLE "User" ADD COLUMN     "targetOwnerId" TEXT,
ALTER COLUMN "colorHex" SET DEFAULT '#1B1B1B';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_targetOwnerId_fkey" FOREIGN KEY ("targetOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
