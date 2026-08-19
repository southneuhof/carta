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
      { code: "list-users", name: "List Users", description: "List user accounts.", active: true },
      { code: "detail-users", name: "Detail Users", description: "View a user account.", active: true },
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
      { code: "list-roles", name: "List Roles", description: "List roles.", active: true },
      { code: "detail-roles", name: "Detail Roles", description: "View a role.", active: true },
      { code: "create-roles", name: "Create Roles", description: "Create roles.", active: true },
      { code: "update-roles", name: "Update Roles", description: "Update roles.", active: true },
      { code: "delete-roles", name: "Delete Roles", description: "Delete roles.", active: true },
    ],
  },
  {
    code: "permissions",
    name: "Permissions",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permissions", name: "View Permissions", description: "View the permission catalog.", active: true },
      { code: "list-permissions", name: "List Permissions", description: "List permissions.", active: true },
      { code: "detail-permissions", name: "Detail Permissions", description: "View a permission.", active: true },
    ],
  },
  {
    code: "role-permissions",
    name: "Role Permissions",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-role-permissions", name: "View Role Permissions", description: "View role permission mappings.", active: true },
      { code: "list-role-permissions", name: "List Role Permissions", description: "List role permission mappings.", active: true },
      { code: "create-role-permissions", name: "Create Role Permissions", description: "Create role permission mappings.", active: true },
      { code: "delete-role-permissions", name: "Delete Role Permissions", description: "Delete role permission mappings.", active: true },
    ],
  },
  {
    code: "system-role-assignments",
    name: "System Role Assignments",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-system-role-assignments", name: "View System Role Assignments", description: "View user system role assignments.", active: true },
      { code: "list-system-role-assignments", name: "List System Role Assignments", description: "List user system role assignments.", active: true },
      { code: "create-system-role-assignments", name: "Create System Role Assignments", description: "Create user system role assignments.", active: true },
      { code: "delete-system-role-assignments", name: "Delete System Role Assignments", description: "Delete user system role assignments.", active: true },
    ],
  },
  {
    code: "project-role-assignments",
    name: "Project Role Assignments",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-project-role-assignments", name: "View Project Role Assignments", description: "View user project role assignments.", active: true },
      { code: "list-project-role-assignments", name: "List Project Role Assignments", description: "List user project role assignments.", active: true },
      { code: "create-project-role-assignments", name: "Create Project Role Assignments", description: "Create user project role assignments.", active: true },
      { code: "delete-project-role-assignments", name: "Delete Project Role Assignments", description: "Delete user project role assignments.", active: true },
    ],
  },
  {
    code: "business-categories",
    name: "Business Categories",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-business-categories", name: "View Business Categories", description: "View business categories.", active: true },
      { code: "list-business-categories", name: "List Business Categories", description: "List business categories.", active: true },
      { code: "detail-business-categories", name: "Detail Business Categories", description: "View a business category.", active: true },
      { code: "create-business-categories", name: "Create Business Categories", description: "Create business categories.", active: true },
      { code: "update-business-categories", name: "Update Business Categories", description: "Update business categories.", active: true },
      { code: "delete-business-categories", name: "Delete Business Categories", description: "Delete business categories.", active: true },
    ],
  },
  {
    code: "divisions",
    name: "Divisions",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-divisions", name: "View Divisions", description: "View divisions.", active: true },
      { code: "list-divisions", name: "List Divisions", description: "List divisions.", active: true },
      { code: "detail-divisions", name: "Detail Divisions", description: "View a division.", active: true },
      { code: "create-divisions", name: "Create Divisions", description: "Create divisions.", active: true },
      { code: "update-divisions", name: "Update Divisions", description: "Update divisions.", active: true },
      { code: "delete-divisions", name: "Delete Divisions", description: "Delete divisions.", active: true },
    ],
  },
  {
    code: "uoms",
    name: "Units of Measure",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-uoms", name: "View Units of Measure", description: "View units of measure.", active: true },
      { code: "list-uoms", name: "List Units of Measure", description: "List units of measure.", active: true },
      { code: "detail-uoms", name: "Detail Units of Measure", description: "View a unit of measure.", active: true },
      { code: "create-uoms", name: "Create Units of Measure", description: "Create units of measure.", active: true },
      { code: "update-uoms", name: "Update Units of Measure", description: "Update units of measure.", active: true },
      { code: "delete-uoms", name: "Delete Units of Measure", description: "Delete units of measure.", active: true },
    ],
  },
  {
    code: "pts-work-categories",
    name: "PTS Work Categories",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-pts-work-categories", name: "View PTS Work Categories", description: "View PTS work categories.", active: true },
      { code: "list-pts-work-categories", name: "List PTS Work Categories", description: "List PTS work categories.", active: true },
      { code: "detail-pts-work-categories", name: "Detail PTS Work Categories", description: "View a PTS work category.", active: true },
      { code: "create-pts-work-categories", name: "Create PTS Work Categories", description: "Create PTS work categories.", active: true },
      { code: "update-pts-work-categories", name: "Update PTS Work Categories", description: "Update PTS work categories.", active: true },
      { code: "delete-pts-work-categories", name: "Delete PTS Work Categories", description: "Delete PTS work categories.", active: true },
    ],
  },
  {
    code: "permit-work-types",
    name: "Permit Work Types",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permit-work-types", name: "View Permit Work Types", description: "View permit work types.", active: true },
      { code: "list-permit-work-types", name: "List Permit Work Types", description: "List permit work types.", active: true },
      { code: "detail-permit-work-types", name: "Detail Permit Work Types", description: "View a permit work type.", active: true },
      { code: "create-permit-work-types", name: "Create Permit Work Types", description: "Create permit work types.", active: true },
      { code: "update-permit-work-types", name: "Update Permit Work Types", description: "Update permit work types.", active: true },
      { code: "delete-permit-work-types", name: "Delete Permit Work Types", description: "Delete permit work types.", active: true },
    ],
  },
  {
    code: "permit-danger-source",
    name: "Permit Danger Source",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permit-danger-source", name: "View Permit Danger Source", description: "View permit danger sources.", active: true },
      { code: "list-permit-danger-source", name: "List Permit Danger Source", description: "List permit danger sources.", active: true },
      { code: "detail-permit-danger-source", name: "Detail Permit Danger Source", description: "View a permit danger source.", active: true },
      { code: "create-permit-danger-source", name: "Create Permit Danger Source", description: "Create permit danger sources.", active: true },
      { code: "update-permit-danger-source", name: "Update Permit Danger Source", description: "Update permit danger sources.", active: true },
      { code: "delete-permit-danger-source", name: "Delete Permit Danger Source", description: "Delete permit danger sources.", active: true },
    ],
  },
  {
    code: "permit-attachment",
    name: "Permit Attachment",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permit-attachment", name: "View Permit Attachment", description: "View permit attachments.", active: true },
      { code: "list-permit-attachment", name: "List Permit Attachment", description: "List permit attachments.", active: true },
      { code: "detail-permit-attachment", name: "Detail Permit Attachment", description: "View a permit attachment.", active: true },
      { code: "create-permit-attachment", name: "Create Permit Attachment", description: "Create permit attachments.", active: true },
      { code: "update-permit-attachment", name: "Update Permit Attachment", description: "Update permit attachments.", active: true },
      { code: "delete-permit-attachment", name: "Delete Permit Attachment", description: "Delete permit attachments.", active: true },
    ],
  },
  {
    code: "safety-checklist",
    name: "Safety Checklist",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-safety-checklist", name: "View Safety Checklist", description: "View safety checklist entries.", active: true },
      { code: "list-safety-checklist", name: "List Safety Checklist", description: "List safety checklist entries.", active: true },
      { code: "detail-safety-checklist", name: "Detail Safety Checklist", description: "View a safety checklist entry.", active: true },
      { code: "create-safety-checklist", name: "Create Safety Checklist", description: "Create safety checklist entries.", active: true },
      { code: "update-safety-checklist", name: "Update Safety Checklist", description: "Update safety checklist entries.", active: true },
      { code: "delete-safety-checklist", name: "Delete Safety Checklist", description: "Delete safety checklist entries.", active: true },
    ],
  },
  {
    code: "permit-category-apd",
    name: "Permit Category APD",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permit-category-apd", name: "View Permit Category APD", description: "View permit APD categories.", active: true },
      { code: "list-permit-category-apd", name: "List Permit Category APD", description: "List permit APD categories.", active: true },
      { code: "detail-permit-category-apd", name: "Detail Permit Category APD", description: "View a permit APD category.", active: true },
      { code: "create-permit-category-apd", name: "Create Permit Category APD", description: "Create permit APD categories.", active: true },
      { code: "update-permit-category-apd", name: "Update Permit Category APD", description: "Update permit APD categories.", active: true },
      { code: "delete-permit-category-apd", name: "Delete Permit Category APD", description: "Delete permit APD categories.", active: true },
    ],
  },
  {
    code: "permit-apd",
    name: "Permit APD",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-permit-apd", name: "View Permit APD", description: "View permit APD records.", active: true },
      { code: "list-permit-apd", name: "List Permit APD", description: "List permit APD records.", active: true },
      { code: "detail-permit-apd", name: "Detail Permit APD", description: "View a permit APD record.", active: true },
      { code: "create-permit-apd", name: "Create Permit APD", description: "Create permit APD records.", active: true },
      { code: "update-permit-apd", name: "Update Permit APD", description: "Update permit APD records.", active: true },
      { code: "delete-permit-apd", name: "Delete Permit APD", description: "Delete permit APD records.", active: true },
    ],
  },
  {
    code: "root-causes",
    name: "Root Causes",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-root-causes", name: "View Root Causes", description: "View root causes.", active: true },
      { code: "list-root-causes", name: "List Root Causes", description: "List root causes.", active: true },
      { code: "detail-root-causes", name: "Detail Root Causes", description: "View a root cause.", active: true },
      { code: "create-root-causes", name: "Create Root Causes", description: "Create root causes.", active: true },
      { code: "update-root-causes", name: "Update Root Causes", description: "Update root causes.", active: true },
      { code: "delete-root-causes", name: "Delete Root Causes", description: "Delete root causes.", active: true },
    ],
  },
  {
    code: "number-variables",
    name: "Number Variables",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-number-variables", name: "View Number Variables", description: "View number variables.", active: true },
      { code: "list-number-variables", name: "List Number Variables", description: "List number variables.", active: true },
      { code: "detail-number-variables", name: "Detail Number Variables", description: "View a number variable.", active: true },
    ],
  },
  {
    code: "number-configs",
    name: "Number Configurations",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-number-configs", name: "View Number Configurations", description: "View number configurations.", active: true },
      { code: "list-number-configs", name: "List Number Configurations", description: "List number configurations.", active: true },
      { code: "detail-number-configs", name: "Detail Number Configurations", description: "View a number configuration.", active: true },
      { code: "create-number-configs", name: "Create Number Configurations", description: "Create number configurations.", active: true },
      { code: "update-number-configs", name: "Update Number Configurations", description: "Update number configurations.", active: true },
      { code: "delete-number-configs", name: "Delete Number Configurations", description: "Delete number configurations.", active: true },
    ],
  },
  {
    code: "projects",
    name: "Projects",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-projects", name: "View Projects", description: "View projects.", active: true },
      { code: "list-projects", name: "List Projects", description: "List projects.", active: true },
      { code: "detail-projects", name: "Detail Projects", description: "View a project.", active: true },
      { code: "create-projects", name: "Create Projects", description: "Create projects.", active: true },
      { code: "update-projects", name: "Update Projects", description: "Update projects.", active: true },
      { code: "delete-projects", name: "Delete Projects", description: "Delete projects.", active: true },
    ],
  },
  {
    code: "work-items",
    name: "Work Items",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-work-items", name: "View Work Items", description: "View work items.", active: true },
      { code: "list-work-items", name: "List Work Items", description: "List work items.", active: true },
      { code: "detail-work-items", name: "Detail Work Items", description: "View a work item.", active: true },
      { code: "create-work-items", name: "Create Work Items", description: "Create work items.", active: true },
      { code: "update-work-items", name: "Update Work Items", description: "Update work items.", active: true },
      { code: "delete-work-items", name: "Delete Work Items", description: "Delete work items.", active: true },
    ],
  },
  {
    code: "project-vendors",
    name: "Project Vendors",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-project-vendors", name: "View Project Vendors", description: "View project vendors.", active: true },
      { code: "list-project-vendors", name: "List Project Vendors", description: "List project vendors.", active: true },
      { code: "detail-project-vendors", name: "Detail Project Vendors", description: "View a project vendor.", active: true },
      { code: "create-project-vendors", name: "Create Project Vendors", description: "Create project vendors.", active: true },
      { code: "update-project-vendors", name: "Update Project Vendors", description: "Update project vendors.", active: true },
      { code: "delete-project-vendors", name: "Delete Project Vendors", description: "Delete project vendors.", active: true },
    ],
  },
  {
    code: "qhsse-pts",
    name: "QHSSE PTS",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-qhsse-pts", name: "View QHSSE PTS", description: "Open the QHSSE PTS menu.", active: true },
      { code: "list-qhsse-pts", name: "List QHSSE PTS", description: "List QHSSE PTS reports.", active: true },
      { code: "detail-qhsse-pts", name: "Detail QHSSE PTS", description: "View a QHSSE PTS report.", active: true },
    ],
  },
  {
    code: "qhsse-pts-workflow",
    name: "QHSSE PTS Workflow",
    realm: "project",
    active: true,
    permissions: [
      { code: "create-qhsse-pts", name: "Create QHSSE PTS", description: "Create QHSSE PTS reports in scope.", active: true },
      { code: "update-qhsse-pts", name: "Update QHSSE PTS", description: "Update QHSSE PTS reports in scope.", active: true },
      { code: "delete-qhsse-pts", name: "Delete QHSSE PTS", description: "Delete QHSSE PTS reports in scope.", active: true },
      { code: "low-disposition-qhsse-pts", name: "Low Disposition QHSSE PTS", description: "Disposition low QHSSE PTS reports in scope.", active: true },
      { code: "high-disposition-qhsse-pts", name: "High Disposition QHSSE PTS", description: "Disposition medium and high QHSSE PTS reports in scope.", active: true },
      { code: "temporary-plan-qhsse-pts", name: "Temporary Plan QHSSE PTS", description: "Manage temporary plans for QHSSE PTS reports.", active: true },
      { code: "management-notes-qhsse-pts", name: "Management Notes QHSSE PTS", description: "Manage management notes for QHSSE PTS reports.", active: true },
      { code: "complete-report-qhsse-pts", name: "Complete QHSSE PTS Report", description: "Complete QHSSE PTS reports.", active: true },
      { code: "complete-qi-report-qhsse-pts", name: "Complete QI PTS Report", description: "Complete PTS reports created by Quality Inspection.", active: true },
      { code: "follow-up-implementation-qhsse-pts", name: "Follow-up Implementation QHSSE PTS", description: "Manage implementation follow-up for QHSSE PTS reports.", active: true },
      { code: "follow-up-price-qhsse-pts", name: "Follow-up Price QHSSE PTS", description: "Manage price follow-up for QHSSE PTS reports.", active: true },
      { code: "implementation-report-qhsse-pts", name: "Implementation Report QHSSE PTS", description: "Manage implementation reports for QHSSE PTS reports.", active: true },
      { code: "verify-implementation-qhsse-pts", name: "Verify Implementation QHSSE PTS", description: "Verify QHSSE PTS implementation.", active: true },
      { code: "realization-qhsse-pts", name: "Realization QHSSE PTS", description: "Record QHSSE PTS realization.", active: true },
      { code: "close-qhsse-pts", name: "Close QHSSE PTS", description: "Close QHSSE PTS reports.", active: true },
    ],
  },
  {
    code: "quality-inspection",
    name: "Quality Inspection",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-quality-inspection", name: "View Quality Inspection", description: "Open the Inspection/Test menu and list.", active: true },
      { code: "show-quality-inspection", name: "Show Quality Inspection", description: "View an Inspection/Test report.", active: true },
    ],
  },
  {
    code: "quality-inspection-workflow",
    name: "Quality Inspection Workflow",
    realm: "project",
    active: true,
    permissions: [
      { code: "create-quality-inspection", name: "Create Quality Inspection", description: "Create Inspection/Test reports in scope.", active: true },
      { code: "update-quality-inspection", name: "Update Quality Inspection", description: "Update Inspection/Test reports in scope.", active: true },
      { code: "delete-quality-inspection", name: "Delete Quality Inspection", description: "Delete Inspection/Test reports in scope.", active: true },
      { code: "complete-report-quality-inspection", name: "Complete Quality Inspection Report", description: "Complete Inspection/Test report procedure details.", active: true },
      { code: "verify-quality-inspection-work-item-itp", name: "Verify Quality Inspection Work Item", description: "Verify Inspection/Test work-item rows.", active: true },
      { code: "submit-quality-inspection-documentations", name: "Submit Quality Inspection Documentation", description: "Submit Inspection/Test documentation.", active: true },
      { code: "verify-quality-inspection", name: "Verify Quality Inspection", description: "Verify Inspection/Test reports.", active: true },
    ],
  },
  {
    code: "work-item-itp",
    name: "Work Item ITP",
    realm: "project",
    active: true,
    permissions: [
      { code: "create-work-item-itp", name: "Create Work Item ITP", description: "Create inspection test plans for work items in scope.", active: true },
      { code: "update-work-item-itp", name: "Update Work Item ITP", description: "Update inspection test plans for work items in scope.", active: true },
      { code: "delete-work-item-itp", name: "Delete Work Item ITP", description: "Delete inspection test plans for work items in scope.", active: true },
    ],
  },
  {
    code: "emergency-simulation-topics",
    name: "Emergency Simulation Topics",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-emergency-simulation-topics", name: "View Emergency Simulation Topics", description: "View emergency simulation topics.", active: true },
      { code: "list-emergency-simulation-topics", name: "List Emergency Simulation Topics", description: "List emergency simulation topics.", active: true },
      { code: "detail-emergency-simulation-topics", name: "Detail Emergency Simulation Topics", description: "View an emergency simulation topic.", active: true },
      { code: "create-emergency-simulation-topics", name: "Create Emergency Simulation Topics", description: "Create emergency simulation topics.", active: true },
      { code: "update-emergency-simulation-topics", name: "Update Emergency Simulation Topics", description: "Update emergency simulation topics.", active: true },
      { code: "delete-emergency-simulation-topics", name: "Delete Emergency Simulation Topics", description: "Delete emergency simulation topics.", active: true },
    ],
  },
  {
    code: "emergency-simulation-employees",
    name: "Emergency Simulation Employees",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-emergency-simulation-employees", name: "View Emergency Simulation Employees", description: "View emergency simulation employees.", active: true },
      { code: "list-emergency-simulation-employees", name: "List Emergency Simulation Employees", description: "List emergency simulation employees.", active: true },
      { code: "detail-emergency-simulation-employees", name: "Detail Emergency Simulation Employees", description: "View an emergency simulation employee.", active: true },
      { code: "create-emergency-simulation-employees", name: "Create Emergency Simulation Employees", description: "Create emergency simulation employees.", active: true },
      { code: "update-emergency-simulation-employees", name: "Update Emergency Simulation Employees", description: "Update emergency simulation employees.", active: true },
      { code: "delete-emergency-simulation-employees", name: "Delete Emergency Simulation Employees", description: "Delete emergency simulation employees.", active: true },
    ],
  },
  {
    code: "emergency-simulation-tools",
    name: "Emergency Simulation Tools",
    realm: "system",
    active: true,
    permissions: [
      { code: "view-emergency-simulation-tools", name: "View Emergency Simulation Tools", description: "View emergency simulation tools.", active: true },
      { code: "list-emergency-simulation-tools", name: "List Emergency Simulation Tools", description: "List emergency simulation tools.", active: true },
      { code: "detail-emergency-simulation-tools", name: "Detail Emergency Simulation Tools", description: "View an emergency simulation tool.", active: true },
      { code: "create-emergency-simulation-tools", name: "Create Emergency Simulation Tools", description: "Create emergency simulation tools.", active: true },
      { code: "update-emergency-simulation-tools", name: "Update Emergency Simulation Tools", description: "Update emergency simulation tools.", active: true },
      { code: "delete-emergency-simulation-tools", name: "Delete Emergency Simulation Tools", description: "Delete emergency simulation tools.", active: true },
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
