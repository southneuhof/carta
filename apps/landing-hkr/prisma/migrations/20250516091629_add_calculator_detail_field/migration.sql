-- CreateEnum
CREATE TYPE "CalculatorDetailFieldType" AS ENUM ('number', 'currency');

-- CreateTable
CREATE TABLE "CalculatorDetailField" (
    "id" TEXT NOT NULL,
    "calculator_type_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "type" "CalculatorDetailFieldType" NOT NULL,
    "unit" TEXT,

    CONSTRAINT "CalculatorDetailField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CalculatorDetailField" ADD CONSTRAINT "CalculatorDetailField_calculator_type_id_fkey" FOREIGN KEY ("calculator_type_id") REFERENCES "CalculatorType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
