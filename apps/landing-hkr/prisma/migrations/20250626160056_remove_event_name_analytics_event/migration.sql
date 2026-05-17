/*
  Warnings:

  - You are about to drop the column `eventName` on the `AnalyticsEvent` table. All the data in the column will be lost.
  - You are about to drop the column `eventValue` on the `AnalyticsEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AnalyticsEvent" DROP COLUMN "eventName",
DROP COLUMN "eventValue",
ADD COLUMN     "event" JSONB;
