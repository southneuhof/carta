/*
  Warnings:

  - You are about to drop the column `title` on the `MenuItemTranslation` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `WebsiteVisit` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `WebsiteVisit` table. All the data in the column will be lost.
  - You are about to drop the column `visitedAt` on the `WebsiteVisit` table. All the data in the column will be lost.
  - Added the required column `name` to the `MenuItemTranslation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `PageTranslation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `PageTranslation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ip_address` to the `WebsiteVisit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuItemTranslation" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WebsiteVisit" DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
DROP COLUMN "visitedAt",
ADD COLUMN     "ip_address" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
