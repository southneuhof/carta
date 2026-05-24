/*
  Warnings:

  - The primary key for the `Permission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Permission` table. All the data in the column will be lost.
  - The primary key for the `_RolePermissions` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_RolePermissions" DROP CONSTRAINT "_RolePermissions_A_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Permission_pkey" PRIMARY KEY ("code");

-- AlterTable
ALTER TABLE "_RolePermissions" DROP CONSTRAINT "_RolePermissions_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("code") ON DELETE CASCADE ON UPDATE CASCADE;
