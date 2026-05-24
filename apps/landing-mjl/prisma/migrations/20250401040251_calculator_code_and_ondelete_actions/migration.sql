/*
  Warnings:

  - Added the required column `code` to the `CalculatorField` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `FormField` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CalculatorField" DROP CONSTRAINT "CalculatorField_calculator_type_id_fkey";

-- DropForeignKey
ALTER TABLE "FormField" DROP CONSTRAINT "FormField_form_type_id_fkey";

-- DropForeignKey
ALTER TABLE "FormSubmission" DROP CONSTRAINT "FormSubmission_form_type_id_fkey";

-- AlterTable
ALTER TABLE "CalculatorField" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FormField" ADD COLUMN     "code" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_form_type_id_fkey" FOREIGN KEY ("form_type_id") REFERENCES "FormType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_form_type_id_fkey" FOREIGN KEY ("form_type_id") REFERENCES "FormType"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatorField" ADD CONSTRAINT "CalculatorField_calculator_type_id_fkey" FOREIGN KEY ("calculator_type_id") REFERENCES "CalculatorType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
