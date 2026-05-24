-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_gallery_id_fkey";

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_section_id_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_parent_section_id_fkey";

-- DropForeignKey
ALTER TABLE "SectionGroup" DROP CONSTRAINT "SectionGroup_parent_section_id_fkey";

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "Gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionGroup" ADD CONSTRAINT "SectionGroup_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
