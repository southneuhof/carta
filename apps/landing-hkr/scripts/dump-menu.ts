import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const menuItems = await prisma.menuItem.findMany({
    include: {
      translations: true,
      children: {
        include: {
          translations: true,
          children: {
            include: {
              translations: true
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(menuItems, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
