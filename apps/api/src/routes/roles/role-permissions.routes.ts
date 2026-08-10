import { authenticated, defineRoute } from "@southneuhof/sprindle/routes";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { requirePermission } from "../../identity";
import { permissions, role, rolePermissions, roles } from "./roles.entity";

async function exists(table: typeof roles | typeof permissions, id: string) {
  return Boolean(
    (
      await getDb()
        .select({ id: table.id })
        .from(table)
        .where(eq(table.id, id))
        .limit(1)
    )[0],
  );
}

async function mappedPermission(
  roleId: string,
  permissionId: string,
  assigned: boolean,
) {
  const found = await getDb()
    .select()
    .from(permissions)
    .where(eq(permissions.id, permissionId))
    .limit(1);
  return {
    ...role.schemas.select.parse({
      ...(
        await getDb().select().from(roles).where(eq(roles.id, roleId)).limit(1)
      )[0],
    }),
    permission: found[0],
    assigned,
  };
}

async function setAssignment(
  roleId: string,
  permissionId: string,
  active: boolean,
) {
  await getDb()
    .insert(rolePermissions)
    .values({ roleId, permissionId, active })
    .onConflictDoUpdate({
      target: [rolePermissions.roleId, rolePermissions.permissionId],
      set: { active },
    });
  return mappedPermission(roleId, permissionId, active);
}

export const listRolePermissions = defineRoute({
  path: "/roles/:roleId/permissions",
  method: "get",
  authorize: [authenticated(), requirePermission("view-role-permissions")],
  action: async ({ c }) => {
    const roleId = c.req.param("roleId");
    if (!roleId || !(await exists(roles, roleId)))
      return c.json({ error: "not_found" }, 404);
    const data = await getDb()
      .select({
        id: permissions.id,
        permissionCode: permissions.permissionCode,
        name: permissions.name,
        assignedActive: rolePermissions.active,
      })
      .from(permissions)
      .leftJoin(
        rolePermissions,
        and(
          eq(rolePermissions.permissionId, permissions.id),
          eq(rolePermissions.roleId, roleId),
        ),
      )
      .orderBy(permissions.permissionCode);
    return c.json({
      data: data.map(({ assignedActive, ...permission }) => ({
        ...permission,
        assigned: assignedActive === true,
      })),
      total: data.length,
    });
  },
});

export const assignRolePermission = defineRoute({
  path: "/roles/:roleId/permissions/:permissionId",
  method: "put",
  authorize: [authenticated(), requirePermission("manage-role-permissions")],
  action: async ({ c }) => {
    const { roleId, permissionId } = c.req.param();
    if (
      !(await exists(roles, roleId)) ||
      !(await exists(permissions, permissionId))
    )
      return c.json({ error: "not_found" }, 404);
    return c.json({ data: await setAssignment(roleId, permissionId, true) });
  },
});

export const revokeRolePermission = defineRoute({
  path: "/roles/:roleId/permissions/:permissionId",
  method: "delete",
  authorize: [authenticated(), requirePermission("manage-role-permissions")],
  action: async ({ c }) => {
    const { roleId, permissionId } = c.req.param();
    if (
      !(await exists(roles, roleId)) ||
      !(await exists(permissions, permissionId))
    )
      return c.json({ error: "not_found" }, 404);
    return c.json({ data: await setAssignment(roleId, permissionId, false) });
  },
});
