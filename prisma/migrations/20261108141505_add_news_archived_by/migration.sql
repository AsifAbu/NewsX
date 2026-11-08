-- AlterTable
ALTER TABLE "News" ADD COLUMN     "archivedById" TEXT;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
