import { authenticated, defineRoute } from "@southneuhof/sprindle/routes";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { requirePermission } from "../../identity";
import { users } from "../users/users.entity";
import { role, roles, userRoles } from "./roles.entity";

async function userExists(id: string) {
  return Boolean(
    (
      await getDb()
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id))
        .limit(1)
    )[0],
  );
}
async function roleRow(id: string) {
  return (
    await getDb()
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), eq(roles.active, true)))
      .limit(1)
  )[0];
}

async function setAssignment(userId: string, roleId: string, active: boolean) {
  const found = await roleRow(roleId);
  if (!found || found.assignmentScope !== "global") return null;
  await getDb()
    .insert(userRoles)
    .values({ userId, roleId, active })
    .onConflictDoUpdate({
      target: [userRoles.userId, userRoles.roleId],
      set: { active },
    });
  return { ...role.schemas.select.parse(found), assigned: active };
}

export const listUserRoles = defineRoute({
  path: "/users/:userId/roles",
  method: "get",
  authorize: [authenticated(), requirePermission("view-user-roles")],
  action: async ({ c }) => {
    const userId = c.req.param("userId");
    if (!userId || !(await userExists(userId)))
      return c.json({ error: "not_found" }, 404);
    const data = await getDb()
      .select({
        id: roles.id,
        roleCode: roles.roleCode,
        name: roles.name,
        assignmentScope: roles.assignmentScope,
        assignedActive: userRoles.active,
      })
      .from(roles)
      .leftJoin(
        userRoles,
        and(eq(userRoles.roleId, roles.id), eq(userRoles.userId, userId)),
      )
      .where(eq(roles.assignmentScope, "global"))
      .orderBy(roles.roleCode);
    return c.json({
      data: data.map(({ assignedActive, ...found }) => ({
        ...found,
        assigned: assignedActive === true,
      })),
      total: data.length,
    });
  },
});

export const assignUserRole = defineRoute({
  path: "/users/:userId/roles/:roleId",
  method: "put",
  authorize: [authenticated(), requirePermission("manage-user-roles")],
  action: async ({ c }) => {
    const { userId, roleId } = c.req.param();
    if (!(await userExists(userId))) return c.json({ error: "not_found" }, 404);
    const assigned = await setAssignment(userId, roleId, true);
    return assigned
      ? c.json({ data: assigned })
      : c.json({ error: "global_role_required" }, 422);
  },
});

export const revokeUserRole = defineRoute({
  path: "/users/:userId/roles/:roleId",
  method: "delete",
  authorize: [authenticated(), requirePermission("manage-user-roles")],
  action: async ({ c }) => {
    const { userId, roleId } = c.req.param();
    if (!(await userExists(userId))) return c.json({ error: "not_found" }, 404);
    const assigned = await setAssignment(userId, roleId, false);
    return assigned
      ? c.json({ data: assigned })
      : c.json({ error: "global_role_required" }, 422);
  },
});
