import { parseSearchParams } from '$lib/utils/common';
import prisma from '$lib/utils/prisma';
import { exception, success } from '$lib/utils/response';
import { withPagination } from '$lib/utils/pagination';
import { requirePermission } from '$lib/utils/routing';
import { requireFormTypeAccess } from '$lib/app/api/models/formType';

export async function GET(event) {
  const { url, locals } = event;
  let urlSearchParams = parseSearchParams(url.searchParams);
  if (!urlSearchParams.form_type_id) return exception('form_type_id is required');
  
  try {
    requirePermission(locals, 'list-mappingRoleFormType');
    await requireFormTypeAccess(event, { id: String(urlSearchParams.form_type_id) });

    const paginatedData = await withPagination(async (skip, take) => {
      const allRoles = await prisma.role.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          accessibleFormTypes: {
            where: { id: String(urlSearchParams.form_type_id) },
            select: { id: true },
          },
        },
      });

      const total = await prisma.role.count();
      
      const formattedData = allRoles.map((role) => ({
        id: role.id,
        name: role.name,
        active: role.accessibleFormTypes.length > 0,
      }));

      return { data: formattedData, total };
    }, urlSearchParams);

    return success(paginatedData);
  } catch (error) {
    console.log(error);
    return exception(error);
  }
}
