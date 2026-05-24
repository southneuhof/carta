import { parseSearchParams } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import { exception } from '$lib/utils/response';
import { withPagination } from '$lib/utils/pagination';
import { requirePermission } from '$lib/utils/routing';

export async function GET({url, locals}) {
  let urlSearchParams = parseSearchParams(url.searchParams);
  const roleId = Number(urlSearchParams.role_id);
  if (!roleId) return exception('role_id is required');
  
  try {
    requirePermission(locals, 'list-mappingPermissionRole');

    const paginatedData = await withPagination(async (skip, take) => {
      const searchTerm = urlSearchParams.search?.toString().toLowerCase() || '';

      const permissionWhere = {
        name: {
          contains: searchTerm,
          mode: 'insensitive' as const,
        },
      };

      const [allPermissions, total, rolePermissions] = await prisma.$transaction([
        prisma.permission.findMany({
          skip,
          take,
          where: permissionWhere,
          select: {
            code: true,
            name: true,
            description: true,
          },
        }),
        prisma.permission.count({
          where: permissionWhere,
        }),
        prisma.role.findUnique({
          where: { id: roleId },
          select: {
            permissions: {
              select: { code: true },
            },
          },
        }),
      ]);

      const activePermissionCodes = new Set(rolePermissions?.permissions.map((permission) => permission.code) || []);
      
      const formattedData = allPermissions.map((p) => ({
        code: p.code,
        name: p.name,
        description: p.description,
        active: activePermissionCodes.has(p.code),
      }));

      return { data: formattedData, total };
    }, urlSearchParams);

    return new Response(JSON.stringify(paginatedData), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        pragma: 'no-cache',
        expires: '0',
      },
    });
  } catch (error) {
    console.log(error);
    return exception(error);
  }
}
