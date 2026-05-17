-- DropForeignKey
ALTER TABLE "Gallery" DROP CONSTRAINT "Gallery_section_id_fkey";

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
