import { requireAuthenticatedUser } from '$lib/utils/routing';
import { success } from '$lib/utils/response';

export async function GET({ locals }) {
  const user = requireAuthenticatedUser(locals);

  return success(
    {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role_id: user.role_id,
          role_group_id: user.role.role_group_id,
          role: {
            id: user.role.id,
            name: user.role.name,
            role_group_id: user.role.role_group_id,
          },
        },
        permissions: user.role.permissions.map((permission) => permission.code),
        isPrivilegedRole: Boolean(locals.isPrivilegedRole),
      },
    },
    200,
  );
}
