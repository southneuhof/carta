export type PermissionCode =
  | "view-users"
  | "list-users"
  | "detail-users"
  | "create-users"
  | "update-users"
  | "view-roles"
  | "list-roles"
  | "detail-roles"
  | "create-roles"
  | "update-roles"
  | "delete-roles"
  | "view-permissions"
  | "list-permissions"
  | "detail-permissions"
  | "list-role-permissions"
  | "create-role-permissions"
  | "delete-role-permissions"
  | "list-role-assignments"
  | "create-role-assignments"
  | "delete-role-assignments";

type PermissionDefinition = {
  code: PermissionCode;
  name: string;
  description: string;
  active: true;
};

function permission(code: PermissionCode, name: string, description: string): PermissionDefinition {
  return { code, name, description, active: true };
}

export const permissions = [
  permission("view-users", "View Users", "View user accounts."),
  permission("list-users", "List Users", "List user accounts."),
  permission("detail-users", "Detail Users", "View a user account."),
  permission("create-users", "Create Users", "Create user accounts."),
  permission("update-users", "Update Users", "Update user accounts."),
  permission("view-roles", "View Roles", "View roles."),
  permission("list-roles", "List Roles", "List roles."),
  permission("detail-roles", "Detail Roles", "View a role."),
  permission("create-roles", "Create Roles", "Create roles."),
  permission("update-roles", "Update Roles", "Update roles."),
  permission("delete-roles", "Delete Roles", "Delete roles."),
  permission("view-permissions", "View Permissions", "View permissions."),
  permission("list-permissions", "List Permissions", "List permissions."),
  permission("detail-permissions", "Detail Permissions", "View a permission."),
  permission("list-role-permissions", "List Role Permissions", "List a role's permissions."),
  permission("create-role-permissions", "Grant Role Permission", "Grant a permission to a role."),
  permission("delete-role-permissions", "Revoke Role Permission", "Revoke a permission from a role."),
  permission("list-role-assignments", "List Role Assignments", "List a user's roles."),
  permission("create-role-assignments", "Assign Role", "Assign a role to a user."),
  permission("delete-role-assignments", "Unassign Role", "Remove a role from a user."),
] as const satisfies readonly PermissionDefinition[];

export const permissionByCode = Object.freeze(
  Object.fromEntries(permissions.map((item) => [item.code, { permission: item }])) as Record<
    PermissionCode,
    { permission: PermissionDefinition }
  >,
);
