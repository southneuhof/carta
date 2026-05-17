-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "parent_section_id" TEXT;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
