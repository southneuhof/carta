import { openapiRoute } from "@southneuhof/sprindle/openapi";
import { meRoute } from "../identity";
import { healthRoute } from "./health/health";
import { authRoutes, domain as authDomain } from "./auth/auth";
import { businessCategoryModel, domain as businessCategoriesDomain } from "./business-categories/business-categories";
import { divisionModel, domain as divisionsDomain } from "./divisions/divisions";
import { numberConfigModel, domain as numberConfigsDomain } from "./number-configs/number-configs";
import { numberVariableModel, domain as numberVariablesDomain } from "./number-variables/number-variables";
import { projectModel, domain as projectsDomain } from "./projects/projects";
import { projectVendorModel, domain as projectVendorsDomain } from "./project-vendors/project-vendors";
import { ptsWorkCategoryModel, domain as ptsWorkCategoriesDomain } from "./pts-work-categories/pts-work-categories";
import { rootCauseModel, domain as rootCausesDomain } from "./root-causes/root-causes";
import { uomModel, domain as uomsDomain } from "./uoms/uoms";
import { workItemModel, domain as workItemsDomain } from "./work-items/work-items";
import {
  domain as notificationsDomain,
  notificationModel,
} from "./notifications/notifications";
import {
  assignRolePermission,
  assignUserRole,
  domain as rolesDomain,
  listRolePermissions,
  listUserRoles,
  listProjectUsers,
  revokeRolePermission,
  revokeUserRole,
  assignProjectUser,
  revokeProjectUser,
  permissionModel,
  roleGroupModel,
  roleModel,
} from "./roles/roles";
import { createUser, domain as usersDomain, userModel } from "./users/users";
import {
  deleteFileRoute,
  fileObjectRoute,
  listFilesRoute,
  presignedUploadRoute,
} from "./files/files";
import { domain as qhssePtsDomain, qhssePtsModel } from "./qhsse-pts/qhsse-pts";
import { listPtsLookups } from "./qhsse-pts/qhsse-pts.routes";

export const domainParts = [
  authDomain,
  businessCategoriesDomain,
  divisionsDomain,
  projectsDomain,
  uomsDomain,
  workItemsDomain,
  projectVendorsDomain,
  ptsWorkCategoriesDomain,
  rootCausesDomain,
  numberVariablesDomain,
  numberConfigsDomain,
  rolesDomain,
  usersDomain,
  notificationsDomain,
  qhssePtsDomain,
] as const;

const installedRoutes = [
  healthRoute,
  authRoutes.signInEmail,
  authRoutes.getSession,
  authRoutes.signOut,
  meRoute,
  listFilesRoute,
  presignedUploadRoute,
  fileObjectRoute,
  deleteFileRoute,
  listRolePermissions,
  assignRolePermission,
  revokeRolePermission,
  listUserRoles,
  assignUserRole,
  revokeUserRole,
  listProjectUsers,
  assignProjectUser,
  revokeProjectUser,
  businessCategoryModel,
  divisionModel,
  projectModel,
  uomModel,
  workItemModel,
  projectVendorModel,
  ptsWorkCategoryModel,
  rootCauseModel,
  numberVariableModel,
  numberConfigModel,
  notificationModel,
  roleGroupModel,
  roleModel,
  permissionModel,
  userModel,
  createUser,
  listPtsLookups,
  qhssePtsModel,
] as const;

// Public like /health; attach authenticated() here if the document should require a session.
export const routes = [
  ...installedRoutes,
  openapiRoute(installedRoutes, { title: "Carta API", version: "0.0.0" }),
] as const;
