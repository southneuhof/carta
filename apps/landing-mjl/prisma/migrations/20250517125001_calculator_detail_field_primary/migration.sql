/*
  Warnings:

  - You are about to drop the column `formula` on the `CalculatorType` table. All the data in the column will be lost.
  - Changed the type of `type` on the `CalculatorDetailField` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CalculatorResultType" AS ENUM ('number', 'currency');

-- AlterTable
ALTER TABLE "CalculatorDetailField" ADD COLUMN     "primary" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" "CalculatorResultType" NOT NULL;

-- AlterTable
ALTER TABLE "CalculatorType" DROP COLUMN "formula";

-- DropEnum
DROP TYPE "CalculatorDetailFieldType";
