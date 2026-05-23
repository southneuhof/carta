import { exception } from '$lib/utils/response';
import {
  hasGlobalPermissionAccess,
  requirePermission,
} from '$lib/utils/routing';
import type { RequestEvent } from '@sveltejs/kit';
import type { BaseOperationConfig } from '@southneuhof/landing-sveltekit-framework/types';

export type CrudOperation = 'list' | 'detail' | 'create' | 'update' | 'delete' | 'reorder' | 'verify';

type AuthorizableOperationConfig<T> = Pick<BaseOperationConfig<T>, 'permission' | 'authorize'>;

export function getDefaultPermissionCode(model: string, operation: CrudOperation) {
  const operationPrefixMap = {
    list: 'view',
    detail: 'detail',
    create: 'create',
    update: 'update',
    delete: 'delete',
    reorder: 'update',
    verify: 'verify',
  } as const;

  return `${operationPrefixMap[operation]}-${model}`;
}

export function resolvePermissionCode(
  model: string,
  operation: CrudOperation,
  explicitPermission?: string,
): string | undefined {
  return explicitPermission ?? getDefaultPermissionCode(model, operation);
}

export async function authorizeOperation<T>(
  event: RequestEvent,
  model: string,
  operation: CrudOperation,
  config?: AuthorizableOperationConfig<T>,
  input: Record<string, any> = {},
) {
  if (hasGlobalPermissionAccess(event.locals)) return;

  requirePermission(event.locals, resolvePermissionCode(model, operation, config?.permission));

  if (config?.authorize) {
    await config.authorize(event, input);
  }
}

export function requireRoleScopedAccess(
  locals: App.Locals,
  allowedRoleIds: number[],
  notFoundMessage = 'Record not found',
) {
  if (hasRoleScopedAccess(locals, allowedRoleIds)) return;

  throw exception(notFoundMessage, 404);
}

export function hasRoleScopedAccess(
  locals: App.Locals,
  allowedRoleIds: Array<number | string>,
): boolean {
  if (hasGlobalPermissionAccess(locals)) return true;

  // No explicit role bindings means the resource is unrestricted.
  if (!allowedRoleIds.length) return true;

  const userRoleId = locals.user?.role_id;
  if (userRoleId == null) return false;

  const normalizedUserRoleId = Number(userRoleId);
  if (Number.isNaN(normalizedUserRoleId)) return false;

  return allowedRoleIds.some((roleId) => Number(roleId) === normalizedUserRoleId);
}
