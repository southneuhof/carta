import { defineDomainPart, defineModel } from "@southneuhof/sprindle/model";
import type { RouteAuthorize } from "@southneuhof/sprindle/model";
import type { ModelRuntimeEntity } from "@southneuhof/sprindle/source";
import {
  authenticated,
  create,
  deleteRoute,
  detail,
  list,
  update,
} from "@southneuhof/sprindle/routes";
import { requirePermission } from "../../identity";
import {
  permissions,
  permission,
  role,
  roleGroups,
  roleGroup,
  roles,
  rolePermissions,
  userRoles,
  projectUsers,
} from "./roles.entity";
import {
  assignRolePermission,
  listRolePermissions,
  revokeRolePermission,
} from "./role-permissions.routes";
import {
  assignUserRole,
  listUserRoles,
  revokeUserRole,
} from "./user-roles.routes";
import {
  assignProjectUser,
  listProjectUsers,
  revokeProjectUser,
} from "./project-users.routes";

const readRoles = [authenticated(), requirePermission("view-roles")];
const writeRoles = [authenticated(), requirePermission("manage-roles")];
const readPermissions = [
  authenticated(),
  requirePermission("view-permissions"),
];
const writePermissions = [
  authenticated(),
  requirePermission("manage-permissions"),
];

function crud<
  const TPath extends `/${string}`,
  TEntity extends ModelRuntimeEntity,
>(
  path: TPath,
  entity: TEntity,
  read: RouteAuthorize[],
  write: RouteAuthorize[],
) {
  return defineModel({
    path,
    entity,
    routes: {
      list: list({ authorize: read }),
      detail: detail({ authorize: read }),
      create: create({ authorize: write }),
      update: update({ authorize: write }),
      delete: deleteRoute({ authorize: write }),
    },
  });
}

export const domain = defineDomainPart({
  tables: {
    roleGroups,
    roles,
    permissions,
    rolePermissions,
    userRoles,
    projectUsers,
  },
  entities: [roleGroup, role, permission],
});
export const roleGroupModel = crud(
  "/role-groups",
  roleGroup,
  [authenticated(), requirePermission("view-role-groups")],
  [authenticated(), requirePermission("manage-role-groups")],
);
export const roleModel = crud("/roles", role, readRoles, writeRoles);
export const permissionModel = crud(
  "/permissions",
  permission,
  readPermissions,
  writePermissions,
);

export {
  assignRolePermission,
  assignUserRole,
  listRolePermissions,
  listUserRoles,
  revokeRolePermission,
  revokeUserRole,
  assignProjectUser,
  listProjectUsers,
  revokeProjectUser,
};
export default { domain, roleGroupModel, roleModel, permissionModel };
