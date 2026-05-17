/*
  Warnings:

  - The values [select,checkbox,radio,textarea,image] on the enum `FormFieldValidationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FormFieldValidationType_new" AS ENUM ('text', 'email', 'phone', 'number', 'url', 'date', 'file');
ALTER TABLE "FormField" ALTER COLUMN "validation_type_code" TYPE "FormFieldValidationType_new" USING ("validation_type_code"::text::"FormFieldValidationType_new");
ALTER TYPE "FormFieldValidationType" RENAME TO "FormFieldValidationType_old";
ALTER TYPE "FormFieldValidationType_new" RENAME TO "FormFieldValidationType";
DROP TYPE "FormFieldValidationType_old";
COMMIT;
