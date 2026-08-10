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

Resource: `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.resource.ts`<br>
API: `apps/api/src/routes/business-categories/business-categories.entity.ts`, `business-categories.ts`<br>
Routes: `master-data/business-categories/{index,create,[businessCategoryId]/detail,[businessCategoryId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `name` | required | optional | yes | yes | text | — | no |
| `code` | required, unique | optional | yes | yes | text | — | no |
| `description` | optional | optional | yes | yes | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Divisions

Resource: `apps/web/src/routes/(authenticated)/master-data/divisions/divisions.resource.ts`<br>
API: `apps/api/src/routes/divisions/divisions.entity.ts`, `divisions.ts`<br>
Routes: `master-data/divisions/{index,create,[divisionId]/detail,[divisionId]/edit}.route.vue`  
Mode: standard CRUD; `businessCategoryId` is a parent lookup.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `businessCategoryId` | required | optional | no UUID display | no UUID display | lookup | `businessCategories` | no |
| `code` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `imgThumbnail` | optional | optional | yes | yes | image | existing upload adapter | no |
| `statusCode` | optional, default active | optional | no | no | — | — | default only |

## Projects

Resource: `apps/web/src/routes/(authenticated)/master-data/projects/projects.resource.ts`<br>
API: `apps/api/src/routes/projects/projects.entity.ts`, `projects.ts`<br>
Routes: `master-data/projects/{index,create,[projectId]/detail,[projectId]/edit}` and
`master-data/projects/[projectId]/vendors/index.route.vue`
Mode: standard Project CRUD plus a project-scoped Vendor task; `divisionId` is a
parent lookup.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `divisionId` | required | optional | no UUID display | no UUID display | lookup | `divisions` | no |
| `number` | required | optional | yes | yes | text | — | no |
| `integrationCode` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `shortName` | optional | optional | yes | no | text | — | no |
| `currentProgress` | optional, default 0 | optional | no | no | — | — | default only |
| `location` | optional structured `{address,lat,lng}` | optional structured | yes | yes | location | location adapter | no |
| `startDate` | required by form | optional | yes | no | date | — | no |
| `endDate` | optional | optional | yes | no | date | — | no |
| `description` | optional | optional | yes | yes | textarea | — | no |
| `imgThumbnail` | optional | optional | no | no | — | — | no |
| `isJo` | optional, default false | optional | no | no | — | — | default only |
| `statusCode` | optional, default active | optional | no | no | — | — | default only |
| `active` | optional, default true | optional | no | no | — | — | default only |

## Work Items

Resource: `apps/web/src/routes/(authenticated)/master-data/work-items/work-items.resource.ts`<br>
API: `apps/api/src/routes/work-items/work-items.entity.ts`, `work-items.ts`<br>
Routes: `master-data/work-items/index.route.vue`
Mode: project-scoped tree task; Division filters Project and the tree loads only
after Project selection.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `categoryId` | required for root | optional | yes as label | no raw ID | lookup | `ptsWorkCategories` | no |
| `projectId` | context | context | no | no | lookup | `projects` filtered by division | context |
| `parentId` | context for child | server/context | no | no | — | selected tree row | context |
| `code` | server generated | server-owned | no | no | — | — | yes |
| `name` | required | optional | yes | yes | text | — | no |
| `level` | server calculated | server-owned | no | no | — | — | yes |
| `uomId` | required | optional | yes as label | yes as label | lookup | `uoms` | no |
| `isHighRisk` | required by form, default false | optional | yes as chip | yes as chip | radio | explicit options | no |
| `volume` | required | optional | yes, 2 decimals | yes, 2 decimals | number | — | no |
| ITP flags | server projection | server projection | yes as icons | no | — | — | yes |
| `active` | optional, default true | optional | no | no | — | — | default only |

## UOMs

Resource: `apps/web/src/routes/(authenticated)/master-data/uoms/uoms.resource.ts`<br>
API: `apps/api/src/routes/uoms/uoms.entity.ts`, `uoms.ts`<br>
Routes: `master-data/uoms/{index,create,[uomId]/detail,[uomId]/edit}.route.vue`  
Mode: standard CRUD; list and create use server context `uomType=work-items`.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `code` | required | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `uomType` | server supplied | server supplied | no | no | — | — | yes |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## PTS Work Categories

Resource: `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.resource.ts`<br>
API: `apps/api/src/routes/pts-work-categories/pts-work-categories.entity.ts`, `pts-work-categories.ts`<br>
Routes: `master-data/pts-work-categories/{index,create,[ptsWorkCategoryId]/detail,[ptsWorkCategoryId]/edit}.route.vue`  
Mode: standard CRUD. This is master data, not Quality PTS.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `code` | required, unique | optional | yes | yes | text | — | no |
| `name` | required | optional | yes | yes | text | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Root Causes

Resource: `apps/web/src/routes/(authenticated)/master-data/root-causes/root-causes.resource.ts`<br>
API: `apps/api/src/routes/root-causes/root-causes.entity.ts`, `root-causes.ts`<br>
Routes: `master-data/root-causes/{index,create,[rootCauseId]/detail,[rootCauseId]/edit}.route.vue`  
Mode: standard CRUD.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `name` | required | optional | yes | yes | text | — | no |
| `code` | required, unique | optional | yes | yes | text | — | no |
| `description` | optional | optional | yes | yes | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |

## Project Vendors

Resource: `apps/web/src/routes/(authenticated)/master-data/project-vendors/project-vendors.resource.ts`<br>
API: `apps/api/src/routes/project-vendors/project-vendors.entity.ts`, `project-vendors.ts`<br>
Routes: standalone `master-data/project-vendors/{index,create,[projectVendorId]/edit}`;
Project child `master-data/projects/[projectId]/vendors/index.route.vue`.
Mode: standalone CRUD with a Project lookup, plus a project-scoped child task.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `projectId` | required standalone | context child | no UUID display | no | lookup | `projects` | child context |
| `name` | required | optional | yes | yes | text | — | no |

## Number Variables

Resource: `apps/web/src/routes/(authenticated)/master-data/number-variables/number-variables.resource.ts`<br>
API: `apps/api/src/routes/number-variables/number-variables.entity.ts`, `number-variables.ts`<br>
Routes: `master-data/number-variables/index` and detail only.
Mode: read-only seed-managed administration view.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `code` | seed-managed | not writable | yes | yes | — | — | yes |
| `name` | seed-managed | not writable | yes | yes | — | — | yes |
| `description` | optional | not writable | no | yes | — | — | yes |
| `active` | seed-managed | not writable | yes | yes | — | — | yes |

## Number Configurations

Resource: `apps/web/src/routes/(authenticated)/master-data/number-configs/number-configs.resource.ts`<br>
API: `apps/api/src/routes/number-configs/number-configs.entity.ts`, `number-configs.ts`<br>
Routes: `master-data/number-configs/{index,create,[numberConfigId]/detail,[numberConfigId]/edit}.route.vue`  
Mode: standard CRUD; `numberVariableCode` is a lookup whose submitted value is
the variable code.

| Field | API create | API update | List | Detail | Form renderer | Source | Server supplied |
|---|---|---|---|---|---|---|---|
| `numberVariableCode` | required | optional | no UUID display | no UUID display | lookup | `numberVariables`, pick `code` | no |
| `displayOrder` | server allocated | reorder operation | yes | yes | — | — | yes |
| `numberOfDigits` | optional, default 0 | optional | yes | yes | number | — | default only |
| `customCode` | optional | optional | no | no | text | — | no |
| `description` | optional | optional | no | no | textarea | — | no |
| `active` | optional, default true | optional | yes | yes | checkbox | — | default only |
