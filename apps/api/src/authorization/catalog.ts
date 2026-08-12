export const authorizationRealms = ["system", "project"] as const;
export type AuthorizationRealm = (typeof authorizationRealms)[number];

type PermissionDefinition = {
  code: string;
  name: string;
  description: string;
  active: true;
};

type ModuleDefinition = {
  code: string;
  name: string;
  realm: AuthorizationRealm;
  active: true;
  permissions: readonly PermissionDefinition[];
};

export const authorizationModules = [
  {
    code: "users",
    name: "Users",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-users", name: "View Users", description: "View user accounts.", active: true },
      { code: "create-users", name: "Create Users", description: "Create user accounts.", active: true },
      { code: "update-users", name: "Update Users", description: "Update user accounts.", active: true },
    ],
  },
  {
    code: "roles",
    name: "Roles",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-roles", name: "View Roles", description: "View roles.", active: true },
      { code: "manage-roles", name: "Manage Roles", description: "Create, update, and delete roles.", active: true },
    ],
  },
  {
    code: "permissions",
    name: "Permissions",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permissions", name: "View Permissions", description: "View the permission catalog.", active: true },
      { code: "view-role-permissions", name: "View Role Permissions", description: "View role permission mappings.", active: true },
      { code: "manage-role-permissions", name: "Manage Role Permissions", description: "Change role permission mappings.", active: true },
    ],
  },
  {
    code: "system-role-assignments",
    name: "System Role Assignments",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-system-role-assignments", name: "View System Role Assignments", description: "View user system role assignments.", active: true },
      { code: "manage-system-role-assignments", name: "Manage System Role Assignments", description: "Change user system role assignments.", active: true },
    ],
  },
  {
    code: "project-role-assignments",
    name: "Project Role Assignments",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-project-role-assignments", name: "View Project Role Assignments", description: "View user project role assignments.", active: true },
      { code: "manage-project-role-assignments", name: "Manage Project Role Assignments", description: "Change user project role assignments.", active: true },
    ],
  },
  {
    code: "business-categories",
    name: "Business Categories",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-business-categories", name: "View Business Categories", description: "View business categories.", active: true },
      { code: "manage-business-categories", name: "Manage Business Categories", description: "Change business categories.", active: true },
    ],
  },
  {
    code: "divisions",
    name: "Divisions",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-divisions", name: "View Divisions", description: "View divisions.", active: true },
      { code: "manage-divisions", name: "Manage Divisions", description: "Change divisions.", active: true },
    ],
  },
  {
    code: "project-creation",
    name: "Project Creation",
    realm: "system",
    active: true,
    permissions: [
      { code: "create-projects", name: "Create Projects", description: "Create projects.", active: true },
    ],
  },
  {
    code: "uoms",
    name: "Units of Measure",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-uoms", name: "View Units of Measure", description: "View units of measure.", active: true },
      { code: "manage-uoms", name: "Manage Units of Measure", description: "Change units of measure.", active: true },
    ],
  },
  {
    code: "pts-work-categories",
    name: "PTS Work Categories",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-pts-work-categories", name: "View PTS Work Categories", description: "View PTS work categories.", active: true },
      { code: "manage-pts-work-categories", name: "Manage PTS Work Categories", description: "Change PTS work categories.", active: true },
    ],
  },
  {
    code: "root-causes",
    name: "Root Causes",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-root-causes", name: "View Root Causes", description: "View root causes.", active: true },
      { code: "manage-root-causes", name: "Manage Root Causes", description: "Change root causes.", active: true },
    ],
  },
  {
    code: "number-variables",
    name: "Number Variables",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-number-variables", name: "View Number Variables", description: "View number variables.", active: true },
    ],
  },
  {
    code: "number-configs",
    name: "Number Configurations",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-number-configs", name: "View Number Configurations", description: "View number configurations.", active: true },
      { code: "manage-number-configs", name: "Manage Number Configurations", description: "Change number configurations.", active: true },
    ],
  },
  {
    code: "projects",
    name: "Projects",
    realm: "project",
    active: true,
    permissions: [
      { code: "view-projects", name: "View Projects", description: "View projects in scope.", active: true },
      { code: "manage-projects", name: "Manage Projects", description: "Change projects in scope.", active: true },
    ],
  },
  {
    code: "work-items",
    name: "Work Items",
    realm: "project",
    active: true,
    permissions: [
      { code: "view-work-items", name: "View Work Items", description: "View work items in scope.", active: true },
      { code: "manage-work-items", name: "Manage Work Items", description: "Change work items in scope.", active: true },
    ],
  },
  {
    code: "project-vendors",
    name: "Project Vendors",
    realm: "project",
    active: true,
    permissions: [
      { code: "view-project-vendors", name: "View Project Vendors", description: "View project vendors in scope.", active: true },
      { code: "manage-project-vendors", name: "Manage Project Vendors", description: "Change project vendors in scope.", active: true },
    ],
  },
  {
    code: "qhsse-pts",
    name: "QHSSE PTS",
    realm: "project",
    active: true,
    permissions: [
      { code: "view-qhsse-pts", name: "View QHSSE PTS", description: "View QHSSE PTS reports in scope.", active: true },
      { code: "show-qhsse-pts", name: "Show QHSSE PTS", description: "View QHSSE PTS report details in scope.", active: true },
      { code: "create-qhsse-pts", name: "Create QHSSE PTS", description: "Create QHSSE PTS reports in scope.", active: true },
      { code: "update-qhsse-pts", name: "Update QHSSE PTS", description: "Update QHSSE PTS reports in scope.", active: true },
      { code: "delete-qhsse-pts", name: "Delete QHSSE PTS", description: "Delete QHSSE PTS reports in scope.", active: true },
      { code: "low-disposition-qhsse-pts", name: "Low Disposition QHSSE PTS", description: "Disposition low QHSSE PTS reports in scope.", active: true },
      { code: "high-disposition-qhsse-pts", name: "High Disposition QHSSE PTS", description: "Disposition medium and high QHSSE PTS reports in scope.", active: true },
      { code: "temporary-plan-qhsse-pts", name: "Temporary Plan QHSSE PTS", description: "Manage temporary plans for QHSSE PTS reports.", active: true },
      { code: "management-notes-qhsse-pts", name: "Management Notes QHSSE PTS", description: "Manage management notes for QHSSE PTS reports.", active: true },
      { code: "complete-report-qhsse-pts", name: "Complete QHSSE PTS Report", description: "Complete QHSSE PTS reports.", active: true },
      { code: "follow-up-implementation-qhsse-pts", name: "Follow-up Implementation QHSSE PTS", description: "Manage implementation follow-up for QHSSE PTS reports.", active: true },
      { code: "follow-up-price-qhsse-pts", name: "Follow-up Price QHSSE PTS", description: "Manage price follow-up for QHSSE PTS reports.", active: true },
      { code: "implementation-report-qhsse-pts", name: "Implementation Report QHSSE PTS", description: "Manage implementation reports for QHSSE PTS reports.", active: true },
      { code: "verify-implementation-qhsse-pts", name: "Verify Implementation QHSSE PTS", description: "Verify QHSSE PTS implementation.", active: true },
      { code: "realization-qhsse-pts", name: "Realization QHSSE PTS", description: "Record QHSSE PTS realization.", active: true },
      { code: "close-qhsse-pts", name: "Close QHSSE PTS", description: "Close QHSSE PTS reports.", active: true },
    ],
  },
] as const satisfies readonly ModuleDefinition[];

export type AuthorizationModuleCode = (typeof authorizationModules)[number]["code"];
export type PermissionCode = (typeof authorizationModules)[number]["permissions"][number]["code"];
type CatalogModule = (typeof authorizationModules)[number];
type CatalogPermission = CatalogModule["permissions"][number];
type PermissionIndex = Record<PermissionCode, { module: CatalogModule; permission: CatalogPermission }>;

export const permissionByCode = Object.freeze(
  Object.fromEntries(
    authorizationModules.flatMap((module) =>
      module.permissions.map((permission) => [permission.code, { module, permission }]),
    ),
  ) as PermissionIndex,
);

type PermissionCodeForRealm<TR extends AuthorizationRealm> = Extract<CatalogModule, { realm: TR }>["permissions"][number]["code"];

function codesForRealm<TR extends AuthorizationRealm>(realm: TR) {
  return authorizationModules
    .filter((module) => module.realm === realm)
    .flatMap((module) => module.permissions.map((permission) => permission.code)) as PermissionCodeForRealm<TR>[];
}

export const systemPermissionCodes = Object.freeze(codesForRealm("system"));
export const projectPermissionCodes = Object.freeze(codesForRealm("project"));

export function moduleForPermission(code: PermissionCode): CatalogModule {
  return permissionByCode[code].module;
}

export function realmForPermission(code: PermissionCode): AuthorizationRealm {
  return permissionByCode[code].module.realm;
}
