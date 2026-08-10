import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../src/db";
import { createAuth } from "../src/routes/auth/auth";
import {
  businessCategories,
  divisions,
  numberConfigs,
  numberVariables,
  projects,
  ptsWorkCategories,
  rootCauses,
  uoms,
  workItems,
} from "../src/routes/master-data/master-data.entity";
import {
  permissions,
  roleGroups,
  rolePermissions,
  roles,
  userRoles,
} from "../src/routes/roles/roles.entity";
import { users } from "../src/routes/users/users.entity";

const masterCodes = [
  "business-categories",
  "divisions",
  "projects",
  "uoms",
  "work-items",
  "project-vendors",
  "pts-work-categories",
  "root-causes",
  "number-variables",
  "number-configs",
];
const permissionCodes = [
  "view-users",
  "create-users",
  "update-users",
  "view-role-groups",
  "manage-role-groups",
  "view-roles",
  "manage-roles",
  "view-permissions",
  "manage-permissions",
  "view-role-permissions",
  "manage-role-permissions",
  "view-user-roles",
  "manage-user-roles",
  "view-project-users",
  "manage-project-users",
  ...masterCodes.flatMap((code) => [`view-${code}`, `manage-${code}`]),
  "view-master-data",
  "manage-master-data",
  "view-qhsse-pts",
  "show-qhsse-pts",
  "create-qhsse-pts",
  "update-qhsse-pts",
  "delete-qhsse-pts",
  "disposition-qhsse-pts",
  "temporary-plan-qhsse-pts",
  "management-notes-qhsse-pts",
  "complete-report-qhsse-pts",
  "follow-up-implementation-qhsse-pts",
  "follow-up-price-qhsse-pts",
  "implementation-report-qhsse-pts",
  "verify-implementation-qhsse-pts",
  "realization-qhsse-pts",
  "close-qhsse-pts",
  "access-all-projects",
] as const;

const seedEmail = process.env.ADS_HK_ADMIN_EMAIL ?? "admin@example.com";
const seedPassword = process.env.ADS_HK_ADMIN_PASSWORD ?? "demo-password";

async function main() {
  const db = getDb();
  await db
    .insert(roleGroups)
    .values({
      id: "role-group-admin",
      roleGroupCode: "admin",
      name: "Administration",
      description: "Global administration",
      active: true,
    })
    .onConflictDoUpdate({
      target: roleGroups.roleGroupCode,
      set: { name: "Administration", active: true },
    });
  await db
    .insert(roles)
    .values({
      id: "role-super-admin",
      roleCode: "super-admin",
      name: "Super Administrator",
      roleGroupId: "role-group-admin",
      roleType: "system",
      assignmentScope: "global",
      allowRegister: false,
      active: true,
    })
    .onConflictDoUpdate({
      target: roles.roleCode,
      set: {
        roleGroupId: "role-group-admin",
        assignmentScope: "global",
        active: true,
      },
    });
  await db
    .insert(permissions)
    .values(
      permissionCodes.map((permissionCode) => ({
        id: `permission-${permissionCode}`,
        permissionCode,
        permissionGroup: permissionCode.includes("qhsse")
          ? "qhsse-pts"
          : "administration",
        name: permissionCode,
        active: true,
      })),
    )
    .onConflictDoUpdate({
      target: permissions.permissionCode,
      set: { active: true },
    });
  const seededPermissions = await db
    .select({ id: permissions.id })
    .from(permissions);
  await db
    .insert(rolePermissions)
    .values(
      seededPermissions.map(({ id }) => ({
        roleId: "role-super-admin",
        permissionId: id,
        active: true,
      })),
    )
    .onConflictDoUpdate({
      target: [rolePermissions.roleId, rolePermissions.permissionId],
      set: { active: true },
    });

  let admin = (
    await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, seedEmail))
      .limit(1)
  )[0];
  if (!admin) {
    const result = await createAuth({ allowSignUp: true }).api.signUpEmail({
      body: {
        name: "ADS-HK Administrator",
        email: seedEmail,
        password: seedPassword,
      },
    });
    if (!result.user?.id)
      throw new Error("Development administrator creation failed.");
    admin = { id: result.user.id };
  }
  await db
    .update(users)
    .set({
      name: "ADS-HK Administrator",
      username: process.env.ADS_HK_ADMIN_USERNAME ?? seedEmail.split("@")[0],
      statusCode: "active",
    })
    .where(eq(users.id, admin.id));
  await db
    .insert(userRoles)
    .values({ userId: admin.id, roleId: "role-super-admin", active: true })
    .onConflictDoUpdate({
      target: [userRoles.userId, userRoles.roleId],
      set: { active: true },
    });

  await db
    .insert(businessCategories)
    .values({
      id: "business-category-default",
      code: "DEFAULT",
      name: "Default",
      active: true,
    })
    .onConflictDoNothing();
  await db
    .insert(divisions)
    .values({
      id: "division-default",
      businessCategoryId: "business-category-default",
      code: "DEFAULT",
      name: "Default",
      active: true,
    })
    .onConflictDoNothing();
  await db
    .insert(projects)
    .values({
      id: "project-default",
      divisionId: "division-default",
      number: "DEFAULT",
      integrationCode: "DEFAULT",
      name: "Default Project",
      active: true,
    })
    .onConflictDoNothing();
  await db
    .insert(uoms)
    .values({ id: "uom-each", code: "EA", name: "Each", active: true })
    .onConflictDoNothing();
  await db
    .insert(workItems)
    .values({
      id: "work-item-category-default",
      projectId: "project-default",
      code: "CATEGORY",
      name: "Default Category",
      level: 0,
      active: true,
    })
    .onConflictDoNothing();
  await db
    .insert(workItems)
    .values({
      id: "work-item-default",
      projectId: "project-default",
      parentId: "work-item-category-default",
      code: "ITEM",
      name: "Default Item",
      level: 1,
      uomId: "uom-each",
      active: true,
    })
    .onConflictDoNothing();
  await db
    .insert(ptsWorkCategories)
    .values({
      id: "pts-category-default",
      code: "DEFAULT",
      name: "Default",
      active: true,
    })
    .onConflictDoNothing();
  await db
    .insert(rootCauses)
    .values({
      id: "root-cause-default",
      code: "DEFAULT",
      name: "Default",
      active: true,
    })
    .onConflictDoNothing();
  for (const [id, code] of [
    ["number-variable-number", "number"],
    ["number-variable-form", "form_name"],
    ["number-variable-project", "project_number"],
    ["number-variable-division", "division_code"],
    ["number-variable-year", "year"],
    ["number-variable-month", "month"],
  ] as const) {
    await db
      .insert(numberVariables)
      .values({ id, code, name: code, active: true })
      .onConflictDoNothing();
  }
  await db
    .insert(numberConfigs)
    .values([
      {
        id: "number-config-number",
        numberVariableCode: "number",
        numberOfDigits: 4,
        displayOrder: 1,
        active: true,
      },
      {
        id: "number-config-form",
        numberVariableCode: "form_name",
        numberOfDigits: 0,
        displayOrder: 2,
        active: true,
      },
      {
        id: "number-config-project",
        numberVariableCode: "project_number",
        numberOfDigits: 0,
        displayOrder: 3,
        active: true,
      },
      {
        id: "number-config-year",
        numberVariableCode: "year",
        numberOfDigits: 0,
        displayOrder: 4,
        active: true,
      },
    ])
    .onConflictDoNothing();
  await closeDb();
}

main().catch(async (error: unknown) => {
  await closeDb();
  throw error;
});
