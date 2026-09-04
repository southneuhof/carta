import { defineModule } from "@southneuhof/sprindle/model";
import { meRoute } from "../identity";
import { healthRoute } from "./health/health";
import { authRoutes, domain as authDomain } from "./auth/auth";
import {
  domain as rolesDomain,
  roleModel,
} from "./roles/roles";
import { permissionModel } from "./permissions/permissions";
import {
  assignRolePermission,
  listRolePermissions,
  revokeRolePermission,
} from "./role-permissions/role-permissions.routes";
import {
  assignRole,
  listRoleAssignments,
  revokeRole,
} from "./role-assignments/role-assignments.routes";
import { domain as usersDomain, userModel } from "./users/users";
import {
  deleteFileRoute,
  fileObjectRoute,
  listFilesRoute,
  presignedUploadRoute,
} from "./files/files";

// One registration point per module: a module bundle pairs its database
// ownership (domain) with everything it mounts (models). db.ts derives the
// domain parts from this list; installSprindle mounts the models. The order
// below is the mount order.
export const modules = [
  defineModule({ models: [healthRoute] }),
  defineModule({ models: [meRoute] }),
  defineModule({ models: [listFilesRoute, presignedUploadRoute, fileObjectRoute, deleteFileRoute] }),
  defineModule({ domain: authDomain, models: [authRoutes.signInEmail, authRoutes.getSession, authRoutes.signOut] }),
  defineModule({
    domain: rolesDomain,
    models: [
      roleModel,
      permissionModel,
      listRolePermissions,
      assignRolePermission,
      revokeRolePermission,
      listRoleAssignments,
      assignRole,
      revokeRole,
    ],
  }),
  defineModule({ domain: usersDomain, models: [userModel] }),
] as const;
