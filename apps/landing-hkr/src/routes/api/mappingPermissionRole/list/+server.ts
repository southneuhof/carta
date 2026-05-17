import { parseSearchParams } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { withPagination } from '$lib/utils/pagination';
import { requirePermission } from '$lib/utils/routing';

export async function GET({url, locals}) {
  let urlSearchParams = parseSearchParams(url.searchParams);
  if (!urlSearchParams.role_id) return exception('role_id is required');
  
  try {
    requirePermission(locals, 'list-mappingPermissionRole');

    const paginatedData = await withPagination(async (skip, take) => {
      const searchTerm = urlSearchParams.search?.toString().toLowerCase() || '';
      
      const allPermissions = await prisma.permission.findMany({
        skip,
        take,
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        select: {
          code: true,
          name: true,
          description: true,
          roles: {
            where: { id: Number(urlSearchParams.role_id) },
            select: { id: true },
          },
        },
      });

      const total = await prisma.permission.count({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      });
      
      const formattedData = allPermissions.map((p) => ({
        code: p.code,
        name: p.name,
        description: p.description,
        active: p.roles.length > 0,
      }));

      return { data: formattedData, total };
    }, urlSearchParams);

    return success(paginatedData);
  } catch (error) {
    console.log(error);
    return exception(error);
  }
}
