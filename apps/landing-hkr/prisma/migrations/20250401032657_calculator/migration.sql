-- CreateEnum
CREATE TYPE "CalculatorFieldType" AS ENUM ('number', 'select');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FieldType" ADD VALUE 'number';
ALTER TYPE "FieldType" ADD VALUE 'select';

-- AlterTable
ALTER TABLE "FormField" ADD COLUMN     "data" JSONB;

-- CreateTable
CREATE TABLE "CalculatorType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,

    CONSTRAINT "CalculatorType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculatorField" (
    "id" TEXT NOT NULL,
    "calculator_type_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "colSpan" INTEGER NOT NULL DEFAULT 12,
    "type" "CalculatorFieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "helperMessage" TEXT,
    "data" JSONB,

    CONSTRAINT "CalculatorField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CalculatorField" ADD CONSTRAINT "CalculatorField_calculator_type_id_fkey" FOREIGN KEY ("calculator_type_id") REFERENCES "CalculatorType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
