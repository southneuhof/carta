# Current administration form inventory

This inventory covers the current Settings and master-data modules. The API
schemas are the authority. Database IDs and audit fields are server supplied
and are not form fields.

## Role Groups

Resource: `apps/web/src/routes/(authenticated)/settings/role-groups/role-groups.resource.ts`  
API: `apps/api/src/routes/roles/roles.entity.ts`, `apps/api/src/routes/roles/roles.ts`  
Routes: `settings/role-groups/{index,create,[roleGroupId]/detail,[roleGroupId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `roleGroupCode` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Roles

Resource: `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts`  
API: `apps/api/src/routes/roles/roles.entity.ts`, `apps/api/src/routes/roles/roles.ts`  
Routes: `settings/roles/{index,create,[roleId]/detail,[roleId]/edit}.route.vue`  
Mode: standard CRUD. The permission child screen is a separate assignment
workflow and is not a Role form. The current seed grants Role creators both
`manage-roles` and `view-role-groups`, so the Role Group lookup is available.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `roleCode` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `roleGroupId` | required | optional | no UUID display | no UUID display | lookup | `roleGroups` | no |
| `roleType` | optional, default user | optional | no | no | — | — | default only |
| `assignmentScope` | optional, default global | optional | no | no | radio | static global/project options | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `allowRegister` | optional, default false | optional | no | no | — | — | default only |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Permissions

Resource: `apps/web/src/routes/(authenticated)/settings/permissions/permissions.resource.ts`  
API: `apps/api/src/routes/roles/roles.entity.ts`, `apps/api/src/routes/roles/roles.ts`  
Routes: `settings/permissions/{index,create,[permissionId]/detail,[permissionId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `permissionCode` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `permissionGroup` | required | optional | yes | yes | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Users

Resource: `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`  
API: `apps/api/src/routes/users/users.entity.ts`, `apps/api/src/routes/users/users.routes.ts`  
Routes: `settings/users/{index,create,[userId]/detail,[userId]/edit}.route.vue`  
Mode: list/detail/update are standard CRUD; create is a special credential
operation through `/users/create`.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `name` | required | optional | yes | yes | text | — | no |
| `username` | required | optional | yes | yes | text | — | no |
| `email` | required | not writable | yes | yes | text | — | no |
| `password` | required, min 8 | not writable | no | no | password | — | no |
| `imgPhotoUser` | optional nullable | not writable | no | no | text | — | no |
| `statusCode` | server default | optional | yes | yes | text | — | default only |
| authentication flags and timestamps | server supplied | server supplied | no | no | — | — | yes |

## Business Categories

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`businessCategories`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/business-categories/{index,create,[businessCategoryId]/detail,[businessCategoryId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `name` | required | optional | yes | yes | text | — | no |
| `code` | required, unique | optional | yes | yes | text | — | no |
| `description` | optional | optional | yes | yes | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Divisions

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`divisions`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/divisions/{index,create,[divisionId]/detail,[divisionId]/edit}.route.vue`  
Mode: standard CRUD; `businessCategoryId` is a parent lookup.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `businessCategoryId` | required | optional | no UUID display | no UUID display | lookup | `businessCategories` | no |
| `code` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |
| `imgThumbnail` | optional | optional | no | no | — | — | no |
| `statusCode` | optional, default active | optional | no | no | — | — | default only |

## Projects

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`projects`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/projects/{index,create,[projectId]/detail,[projectId]/edit}.route.vue`  
Mode: standard CRUD; `divisionId` is a parent lookup.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `divisionId` | required | optional | no UUID display | no UUID display | lookup | `divisions` | no |
| `number` | required | optional | yes | yes | text | — | no |
| `integrationCode` | required | optional | no | no | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `currentProgress` | optional, default 0 | optional | no | no | — | — | default only |
| `location` | optional | optional | no | no | text | — | no |
| `startDate` | optional | optional | no | no | date | — | no |
| `endDate` | optional | optional | no | no | date | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `imgThumbnail` | optional | optional | no | no | — | — | no |
| `isJo` | optional, default false | optional | no | no | — | — | default only |
| `statusCode` | optional, default active | optional | no | no | — | — | default only |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Work Items

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`workItems`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/work-items/{index,create,[workItemId]/detail,[workItemId]/edit}.route.vue`  
Mode: standard CRUD; project, parent work item, and UOM are lookups. Parent
options are filtered by the selected project and reset when that project
changes.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `projectId` | required | optional | no UUID display | no UUID display | lookup | `projects` | no |
| `parentId` | optional | optional | no UUID display | no UUID display | lookup | `workItems` filtered by project | no |
| `code` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `level` | optional, default 0 | optional | no | no | number | — | default only |
| `uomId` | optional | optional | no UUID display | no UUID display | lookup | `uoms` | no |
| `isHighRisk` | optional, default false | optional | no | no | — | — | default only |
| `volume` | optional | optional | no | no | — | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## UOMs

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`uoms`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/uoms/{index,create,[uomId]/detail,[uomId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `code` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## PTS Work Categories

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`ptsWorkCategories`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/pts-work-categories/{index,create,[ptsWorkCategoryId]/detail,[ptsWorkCategoryId]/edit}.route.vue`  
Mode: standard CRUD. This is master data, not Quality PTS.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `name` | required | optional | yes | yes | text | — | no |
| `code` | required, unique | optional | yes | yes | text | — | no |
| `description` | optional | optional | yes | yes | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Root Causes

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`rootCauses`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/root-causes/{index,create,[rootCauseId]/detail,[rootCauseId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `name` | required | optional | yes | yes | text | — | no |
| `code` | required, unique | optional | yes | yes | text | — | no |
| `description` | optional | optional | yes | yes | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Project Vendors

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`projectVendors`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/project-vendors/{index,create,[projectVendorId]/detail,[projectVendorId]/edit}.route.vue`  
Mode: standard CRUD; `projectId` is a project lookup.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `projectId` | required | optional | no UUID display | no UUID display | lookup | `projects` | no |
| `name` | required | optional | yes | yes | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Number Variables

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`numberVariables`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/number-variables/{index,create,[numberVariableId]/detail,[numberVariableId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `code` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Number Configurations

Resource: `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts` (`numberConfigs`)  
API: `apps/api/src/routes/master-data/master-data.entity.ts`, `master-data.ts`  
Routes: `master-data/number-configs/{index,create,[numberConfigId]/detail,[numberConfigId]/edit}.route.vue`  
Mode: standard CRUD; `numberVariableCode` is a lookup whose submitted value is
the variable code.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `numberVariableCode` | required | optional | no UUID display | no UUID display | lookup | `numberVariables`, pick `code` | no |
| `displayOrder` | required | optional | yes | yes | number | — | no |
| `numberOfDigits` | optional, default 0 | optional | yes | yes | number | — | default only |
| `customCode` | optional | optional | no | no | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |
