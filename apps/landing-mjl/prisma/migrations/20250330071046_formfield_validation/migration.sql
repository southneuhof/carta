/*
  Warnings:

  - You are about to drop the column `validationRegex` on the `FormField` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FormFieldValidationType" AS ENUM ('text', 'email', 'phone', 'number', 'url', 'date', 'select', 'checkbox', 'radio', 'textarea', 'file', 'image');

-- AlterTable
ALTER TABLE "FormField" DROP COLUMN "validationRegex",
ADD COLUMN     "validationType" "FormFieldValidationType";
