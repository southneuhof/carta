import { auth } from '$lib/auth';
import { env } from '$env/dynamic/private';
import { isTrustedOrigin } from '$lib/server/trusted-origins';
import prisma from './prisma';
import {
  addCorsHeaders as frameworkAddCorsHeaders,
  handleCorsPreflightRequest as frameworkHandleCorsPreflightRequest,
  hasPermission as frameworkHasPermission,
  isProtectedRoute,
  requireAuthenticatedUser as frameworkRequireAuthenticatedUser,
  requirePermission as frameworkRequirePermission,
} from '@southneuhof/landing-sveltekit-framework/auth';

export { isProtectedRoute };

export function isBypassAllPermissionsEnabled(): boolean {
  const value = env.BYPASS_ALL_PERMISSIONS?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

export function hasGlobalPermissionAccess(locals?: App.Locals): boolean {
  if (isBypassAllPermissionsEnabled()) return true;
  return Boolean(locals?.isPrivilegedRole);
}

export function handleCorsPreflightRequest(request: Request): Response {
  return frameworkHandleCorsPreflightRequest(request, isTrustedOrigin);
}

export function addCorsHeaders(response: Response, request: Request): Response {
  return frameworkAddCorsHeaders(response, request, isTrustedOrigin);
}

export async function findUserById(userId?: number | string | null): Promise<App.Locals['user']> {
  if (!userId) return null;
  const normalizedUserId = typeof userId === 'string' ? Number(userId) : userId;
  if (!normalizedUserId || Number.isNaN(normalizedUserId)) return null;

  const user = await prisma.user.findUnique({
    where: { id: normalizedUserId },
    include: { role: { include: { permissions: true } } },
  });

  return user || null;
}

export function isPrivilegedUser(user: App.Locals['user']): boolean {
  if (!user) return false;
  return user.role.role_group_id === 1;
}

export async function hydrateRequestAuth(event: { request: Request; locals: App.Locals }) {
  const authSession = await auth.api.getSession({ headers: event.request.headers });
  event.locals.auth = authSession;
  event.locals.user = await findUserById(authSession?.user?.id);
  event.locals.isPrivilegedRole = isPrivilegedUser(event.locals.user);
}

export function requireAuthenticatedUser(locals: App.Locals): NonNullable<App.Locals['user']> {
  return frameworkRequireAuthenticatedUser(locals as any) as NonNullable<App.Locals['user']>;
}

export function hasPermission(locals: App.Locals, permission?: string): boolean {
  if (hasGlobalPermissionAccess(locals)) return true;
  return frameworkHasPermission(locals as any, permission);
}

export function requirePermission(locals: App.Locals, permission?: string): void {
  if (hasGlobalPermissionAccess(locals)) return;
  frameworkRequirePermission(locals as any, permission);
}
