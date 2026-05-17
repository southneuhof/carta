-- AlterEnum
ALTER TYPE "MenuItemRole" ADD VALUE 'project_list';

-- AlterTable
ALTER TABLE "MenuItemTranslation" ADD COLUMN     "description" TEXT,
ADD COLUMN     "media" TEXT;
