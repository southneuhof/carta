import prisma from '$lib/utils/prisma';
import { json } from '@sveltejs/kit';
import { requirePermission } from '$lib/utils/routing';

export async function GET({ locals }) {
  requirePermission(locals, 'view-website');

  const menuItems = await prisma.menuItem.findMany({
    where: {
      parent_id: null // Get root level items
    },
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
    },
    orderBy: {
      order: 'asc'
    }
  });

  return json(menuItems);
}
