/*
  Warnings:

  - You are about to drop the column `validationType` on the `FormField` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "validationType",
ADD COLUMN     "validation_type_code" "FormFieldValidationType";
