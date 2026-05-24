/*
  Warnings:

  - The `status_code` column on the `ArticleTranslation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status_code` column on the `PageTranslation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `action` on the `VerificationLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ArticleTranslation" DROP COLUMN "status_code",
ADD COLUMN     "status_code" TEXT NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "PageTranslation" DROP COLUMN "status_code",
ADD COLUMN     "status_code" TEXT NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "VerificationLog" DROP COLUMN "action",
ADD COLUMN     "action" TEXT NOT NULL;

-- DropEnum
DROP TYPE "VerificationAction";

-- DropEnum
DROP TYPE "VerificationStatusCode";
