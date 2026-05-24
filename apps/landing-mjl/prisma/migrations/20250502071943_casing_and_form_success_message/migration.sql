/*
  Warnings:

  - You are about to drop the column `colSpan` on the `CalculatorField` table. All the data in the column will be lost.
  - You are about to drop the column `helperMessage` on the `CalculatorField` table. All the data in the column will be lost.
  - You are about to drop the column `colSpan` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `helperMessage` on the `FormField` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CalculatorField" DROP COLUMN "colSpan",
DROP COLUMN "helperMessage",
ADD COLUMN     "col_span" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "helper_message" TEXT;

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "colSpan",
DROP COLUMN "helperMessage",
ADD COLUMN     "col_span" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "helper_message" TEXT;

-- AlterTable
ALTER TABLE "FormType" ADD COLUMN     "success_message" TEXT NOT NULL DEFAULT 'Terima kasih!';
