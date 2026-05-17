/*
  Warnings:

  - You are about to drop the column `event` on the `AnalyticsEvent` table. All the data in the column will be lost.
  - Added the required column `source` to the `AnalyticsEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnalyticsEvent" DROP COLUMN "event",
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "target" TEXT;
