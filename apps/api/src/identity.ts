import { forbidden, unauthorized } from "@southneuhof/sprindle";
import { authenticated, defineRoute } from "@southneuhof/sprindle/routes";
import type {
  RouteAuthorize,
  RouteHandlerArgs,
} from "@southneuhof/sprindle/model";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  permissions,
  projectUsers,
  rolePermissions,
  roles,
  userRoles,
} from "./routes/roles/roles.entity";
import { users } from "./routes/users/users.entity";

export type OrgIdentity = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    statusCode: string;
  };
  roleCodes: string[];
  permissions: ReadonlySet<string>;
};

type SessionLike = { user?: { id?: unknown } };
const CACHE_KEY = "adsHk:orgIdentity";

function sessionUserId(session: unknown): string | null {
  const id = (session as SessionLike | null)?.user?.id;
  return typeof id === "string" && id ? id : null;
}

async function resolve(userId: string): Promise<OrgIdentity | null> {
  const db = getDb();
  const profile = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      statusCode: users.statusCode,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = profile[0];
  if (!user || user.statusCode !== "active") return null;

  const activeRoles = await db
    .select({ id: roles.id, code: roles.roleCode })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.active, true),
        eq(roles.active, true),
        eq(roles.assignmentScope, "global"),
      ),
    );

  const roleIds = activeRoles.map((row) => row.id);
  const granted = roleIds.length
    ? await db
        .select({ code: permissions.permissionCode })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .innerJoin(
          permissions,
          eq(permissions.id, rolePermissions.permissionId),
        )
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.active, true),
            eq(roles.active, true),
            eq(roles.assignmentScope, "global"),
            eq(rolePermissions.active, true),
            eq(permissions.active, true),
          ),
        )
    : [];

  return {
    userId,
    user,
    roleCodes: activeRoles.map((row) => row.code),
    permissions: new Set(granted.map((row) => row.code)),
  };
}

export async function orgIdentity(
  args: RouteHandlerArgs,
): Promise<OrgIdentity | null> {
  const cached = args.c.get(CACHE_KEY as never) as
    Promise<OrgIdentity | null> | undefined;
  if (cached) return cached;
  const pending = (async () => {
    const userId = sessionUserId(await args.identity());
    return userId ? resolve(userId) : null;
  })();
  args.c.set(CACHE_KEY as never, pending as never);
  return pending;
}

export function requirePermission(code: string): RouteAuthorize {
  return async (args) => {
    const identity = await orgIdentity(args);
    if (!identity) throw unauthorized();
    if (!identity.permissions.has(code))
      throw forbidden(`Missing permission "${code}".`);
  };
}

export async function hasProjectPermission(
  userId: string,
  projectId: string,
  code: string,
): Promise<boolean> {
  const db = getDb();
  const projectGrant = await db
    .select({ id: projectUsers.userId })
    .from(projectUsers)
    .innerJoin(users, eq(users.id, projectUsers.userId))
    .innerJoin(roles, eq(roles.id, projectUsers.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(projectUsers.userId, userId),
        eq(projectUsers.projectId, projectId),
        eq(projectUsers.active, true),
        eq(users.statusCode, "active"),
        eq(roles.active, true),
        eq(roles.assignmentScope, "project"),
        eq(rolePermissions.active, true),
        eq(permissions.active, true),
        eq(permissions.permissionCode, code),
      ),
    )
    .limit(1);
  if (projectGrant[0]) return true;

  const globalGrant = await db
    .select({ id: userRoles.userId })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.active, true),
        eq(users.statusCode, "active"),
        eq(roles.active, true),
        eq(roles.assignmentScope, "global"),
        eq(rolePermissions.active, true),
        eq(permissions.active, true),
        eq(permissions.permissionCode, code),
      ),
    )
    .limit(1);
  if (!globalGrant[0]) return false;

  const allProjectGrant = await db
    .select({ id: userRoles.userId })
    .from(userRoles)
    .innerJoin(users, eq(users.id, userRoles.userId))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(
      and(
        eq(userRoles.userId, userId),
        eq(userRoles.active, true),
        eq(users.statusCode, "active"),
        eq(roles.active, true),
        eq(roles.assignmentScope, "global"),
        eq(rolePermissions.active, true),
        eq(permissions.active, true),
        eq(permissions.permissionCode, "access-all-projects"),
      ),
    )
    .limit(1);
  return Boolean(allProjectGrant[0]);
}

export function requireProjectPermission(
  projectParameter: string,
  code: string,
): RouteAuthorize {
  return async (args) => {
    const identity = await orgIdentity(args);
    if (!identity) throw unauthorized();
    const projectId = args.c.req.param(projectParameter);
    if (
      !projectId ||
      !(await hasProjectPermission(identity.userId, projectId, code))
    )
      throw forbidden(`Missing project permission "${code}".`);
  };
}

export const meRoute = defineRoute({
  path: "/me",
  method: "get",
  authorize: [authenticated()],
  action: async (args) => {
    const identity = await orgIdentity(args);
    if (!identity) throw unauthorized();
    return args.c.json({
      data: { ...identity, permissions: [...identity.permissions] },
    });
  },
});
