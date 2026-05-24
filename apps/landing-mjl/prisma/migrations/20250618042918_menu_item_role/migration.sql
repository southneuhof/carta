/*
  Warnings:

  - You are about to drop the column `primary` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `brochure` on the `company_profile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MenuItemRole" AS ENUM ('home', 'document_request');

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "primary",
ADD COLUMN     "role" "MenuItemRole";

-- AlterTable
ALTER TABLE "company_profile" DROP COLUMN "brochure";
