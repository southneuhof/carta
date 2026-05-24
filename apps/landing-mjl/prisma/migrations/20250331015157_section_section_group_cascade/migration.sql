-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_section_group_id_fkey";

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_section_group_id_fkey" FOREIGN KEY ("section_group_id") REFERENCES "SectionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
