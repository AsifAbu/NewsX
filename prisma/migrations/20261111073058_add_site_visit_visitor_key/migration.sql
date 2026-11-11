/*
  Warnings:

  - Added the required column `visitorKey` to the `SiteVisit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Pre-existing rows have no real visitor identity to backfill, so each gets
-- its own random placeholder (counted as a distinct unique visitor rather
-- than collapsed into one) instead of a fixed value for all of them.
ALTER TABLE "SiteVisit" ADD COLUMN     "visitorKey" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "SiteVisit" ALTER COLUMN "visitorKey" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "SiteVisit_visitorKey_idx" ON "SiteVisit"("visitorKey");
