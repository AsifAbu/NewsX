-- Rename CommentReport -> Report, preserving existing rows (data-safe, not a drop+recreate)
ALTER TABLE "CommentReport" RENAME TO "Report";
ALTER TABLE "Report" RENAME CONSTRAINT "CommentReport_pkey" TO "Report_pkey";
ALTER TABLE "Report" RENAME CONSTRAINT "CommentReport_commentId_fkey" TO "Report_commentId_fkey";
ALTER TABLE "Report" RENAME CONSTRAINT "CommentReport_reporterId_fkey" TO "Report_reporterId_fkey";

-- Drop the REPORTED value from CommentStatus — "reported" is now derived
-- purely from the existence of Report rows, not a duplicated status flag.
ALTER TYPE "CommentStatus" RENAME TO "CommentStatus_old";
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'REMOVED');
ALTER TABLE "Comment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Comment" ALTER COLUMN "status" TYPE "CommentStatus" USING ("status"::text::"CommentStatus");
ALTER TABLE "Comment" ALTER COLUMN "status" SET DEFAULT 'VISIBLE';
DROP TYPE "CommentStatus_old";
