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
  assignSystemRole,
  assignProjectRole,
  domain as rolesDomain,
  listRolePermissions,
  listSystemRoleAssignments,
  listProjectRoleAssignments,
  listProjectRoleAssignmentOptions,
  revokeRolePermission,
  revokeSystemRole,
  revokeProjectRole,
  moduleModel,
  permissionModel,
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
import { domain as inspectionTestPlansDomain, inspectionTestPlansModel } from "./inspection-test-plans/inspection-test-plans";
import { domain as qualityInspectionDomain, qualityInspectionModel } from "./quality-inspection/quality-inspection";
import { domain as permitWorkTypesDomain, permitWorkTypeModel } from "./permit-work-types/permit-work-types";
import { domain as permitDangerSourceDomain, permitDangerSourceModel } from "./permit-danger-source/permit-danger-source";
import { domain as permitAttachmentDomain, permitAttachmentModel } from "./permit-attachment/permit-attachment";
import { domain as safetyChecklistDomain, safetyChecklistModel } from "./safety-checklist/safety-checklist";
import { domain as permitCategoryApdDomain, permitCategoryApdModel } from "./permit-category-apd/permit-category-apd";
import { domain as permitApdDomain, permitApdModel } from "./permit-apd/permit-apd";

import { emergencySimulationTopicModel, domain as emergencySimulationTopicsDomain } from "./emergency-simulation-topics/emergency-simulation-topics";
import { lawReferenceItemModel, domain as lawReferenceItemsDomain } from "./law-reference-items/law-reference-items";

import { emergencySimulationEmployeeModel, domain as emergencySimulationEmployeesDomain } from "./emergency-simulation-employees/emergency-simulation-employees";

import { emergencySimulationToolModel, domain as emergencySimulationToolsDomain } from "./emergency-simulation-tools/emergency-simulation-tools";
import { tollCausesAccidentsModel, domain as tollCausesAccidentsDomain } from "./toll-causes-accidents/toll-causes-accidents";

import { toolsTypeModel, domain as toolsTypesDomain } from "./tools-types/tools-types";

import { toolsBrandModel, domain as toolsBrandsDomain } from "./tools-brands/tools-brands";
import { domain as hsseObservationDomain, findingCauseModel, findingCategoryModel, findingCriteriaModel, findingTypeModel } from "./hsse-observation/hsse-observation";
import { domain as incidentStatementDocumentConfigsDomain, incidentStatementDocumentConfigModel } from "./incident-statement-document-configs/incident-statement-document-configs";
import { domain as orientationDomain } from "./orientation/orientation";
import { domain as syllabusDomain, syllabusModel } from "./syllabus/syllabus";
import { domain as syllabusCategoriesDomain, syllabusCategoriesModel } from "./syllabus-categories/syllabus-categories";
import { domain as learningMaterialsDomain, learningMaterialsModel } from "./learning-materials/learning-materials";

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
  inspectionTestPlansDomain,
  qualityInspectionDomain,
  permitWorkTypesDomain,
  permitDangerSourceDomain,
  permitAttachmentDomain,
  safetyChecklistDomain,
  permitCategoryApdDomain,
  permitApdDomain,
  emergencySimulationTopicsDomain,
  lawReferenceItemsDomain,
  emergencySimulationEmployeesDomain,
  emergencySimulationToolsDomain,
  tollCausesAccidentsDomain,
  toolsTypesDomain,
  toolsBrandsDomain,
  hsseObservationDomain,
  incidentStatementDocumentConfigsDomain,
  orientationDomain,
  syllabusDomain,
  syllabusCategoriesDomain,
  learningMaterialsDomain,
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
  listSystemRoleAssignments,
  assignSystemRole,
  revokeSystemRole,
  listProjectRoleAssignmentOptions,
  listProjectRoleAssignments,
  assignProjectRole,
  revokeProjectRole,
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
  moduleModel,
  roleModel,
  permissionModel,
  userModel,
  createUser,
  qhssePtsModel,
  inspectionTestPlansModel,
  qualityInspectionModel,
  permitWorkTypeModel,
  permitDangerSourceModel,
  permitAttachmentModel,
  safetyChecklistModel,
  permitCategoryApdModel,
  permitApdModel,
  emergencySimulationTopicModel,
  lawReferenceItemModel,
  emergencySimulationEmployeeModel,
  emergencySimulationToolModel,
  tollCausesAccidentsModel,
  toolsTypeModel,
  toolsBrandModel,
  findingCriteriaModel,
  findingTypeModel,
  findingCategoryModel,
  findingCauseModel,
  incidentStatementDocumentConfigModel,
  syllabusModel,
  syllabusCategoriesModel,
  learningMaterialsModel,
] as const;

// Public like /health; attach authenticated() here if the document should require a session.
export const routes = [
  ...installedRoutes,
  openapiRoute(installedRoutes, { title: "Carta API", version: "0.0.0" }),
] as const;
