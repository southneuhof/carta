# Plan 001: Put each current resource in its own module

> **Implementation instructions**: Use `$ads-hk-module-slice`. This plan moves
> current code only. It must not change a database table, API path, field,
> permission, workflow rule, or frontend route. Run every check. If a STOP
> condition occurs, stop and report it. Update only this plan row after review.
>
> **Drift check (run first)**: `git diff --stat e153b7b..HEAD -- apps/api/src/routes apps/api/scripts/seed.ts apps/api/src/__tests__/qhsse-pts.spec.ts "apps/web/src/routes/(authenticated)/master-data" apps/web/src/route-map.d.ts`
> If a listed file changed, compare the facts below with the live code. Stop if
> a module, relation, or endpoint differs from this plan.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `e153b7b`, 2026-08-10

## Why this matters

`master-data` is a frontend-only navigation group. The current API uses it as
a backend module and stores ten unrelated resources in two files. The current
web route group also stores all ten resource catalogs in one file. This plan
gives every resource a colocated API module and web resource module before any
legacy field alignment continues.

## Required module boundary

```text
apps/web/src/routes/(authenticated)/master-data/       # URL and navigation only
  business-categories/                                 # pages + resource files
  divisions/
  ...

apps/api/src/routes/
  business-categories/                                 # API resource module
  divisions/
  projects/
  uoms/
  work-items/
  project-vendors/
  pts-work-categories/
  root-causes/
  number-variables/
  number-configs/
```

Each API folder owns its table, entity schema, model, permission checks,
validation, and local relations. Each web folder owns its operations, resource,
focused resource test, and route pages. `apps/api/src/routes/index.ts` may
register modules only. It must not contain resource behavior.

## Current state

- `apps/api/src/routes/master-data/master-data.entity.ts:14-283` defines ten
  tables, entities, and relations. The current tables already have UUID defaults
  and audit rules.
- `apps/api/src/routes/master-data/master-data.ts:31-181` defines ten models
  and holds parent validation and delete protection in `validateMaster`.
- `apps/api/src/routes/index.ts:5-78` imports one `masterDataDomain` and ten
  models. It is the API composition root.
- QHSSE PTS, Roles, Notifications, the seed script, and `qhsse-pts.spec.ts`
  import tables from the old shared entity file.
- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts:1-331`
  defines all operation handlers, route targets, types, and resource catalogs.
  Every Master Data page imports from this file.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts` and
  `roles.operations.ts` are the local web pattern to copy.

| Resource | API folder | Web files in the existing route folder |
|---|---|---|
| Business Categories | `business-categories/` | `business-categories.{resource,operations}.ts` |
| Divisions | `divisions/` | `divisions.{resource,operations}.ts` |
| Projects | `projects/` | `projects.{resource,operations}.ts` |
| UOMs | `uoms/` | `uoms.{resource,operations}.ts` |
| Work Items | `work-items/` | `work-items.{resource,operations}.ts` |
| Project Vendors | `project-vendors/` | `project-vendors.{resource,operations}.ts` |
| PTS Work Categories | `pts-work-categories/` | `pts-work-categories.{resource,operations}.ts` |
| Root Causes | `root-causes/` | `root-causes.{resource,operations}.ts` |
| Number Variables | `number-variables/` | `number-variables.{resource,operations}.ts` |
| Number Configurations | `number-configs/` | `number-configs.{resource,operations}.ts` |

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0, no type errors |
| API tests | `pnpm --filter @southneuhof/api test` | exit 0 |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- master-data` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no type errors |
| Removed API group check | `test ! -e apps/api/src/routes/master-data && ! rg -n 'master-data|masterDataDomain|masterDataRelations' apps/api` | exit 0 |
| Diff check | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `apps/api/src/routes/master-data/` — remove after its content moves.
- the ten resource folders under `apps/api/src/routes/` listed above.
- `apps/api/src/routes/index.ts`, direct old-entity importers, the seed script,
  and the QHSSE PTS integration test.
- `apps/web/src/routes/(authenticated)/master-data/` — move each resource and
  operation definition to its route folder; retain the route group and pages.
- focused resource tests in those resource folders and this plan index.

**Out of scope**:

- database migrations, data import, generated-ID changes, field changes,
  workflow changes, and new API or frontend routes;
- changes to `/master-data/...` frontend URLs or route names;
- framework package changes; and
- a new shared CRUD helper, resource barrel, or master-data compatibility file.

## Git workflow

- Keep the current branch. Do not commit, push, or open a pull request unless
  the operator asks.
- Use file moves where possible. Do not keep the old API folder or shared web
  resource file as re-exports.

## Steps

### Step 1: Move API ownership to resource folders

Create the ten API folders in the table. Move each table and `createEntity`
schema into `<resource>.entity.ts`. Move each `defineModel`, permission check,
and validation into `<resource>.ts`. Each module exports `domain` and its model.

Keep database names, UUID defaults, Zod schemas, API paths, permission names,
response shapes, and audit rules unchanged. Use the direct Sprindle
`defineModel` pattern in every module. Do not make a shared CRUD factory.

Put relations and rules with the foreign-key owner:

- Divisions own Business Category rules and the relation.
- Projects own Division rules and the relation.
- Work Items own Project, UOM, and parent rules, relations, and cycle checks.
- Project Vendors own Project rules and the relation.
- Number Configurations own Number Variable rules and the relation.
- Root Causes own the current QHSSE PTS delete protection.

Move parent-reference delete protection to the resource that owns the delete
model. Preserve the current error text and blocked record types.

**Verify**: `pnpm --filter @southneuhof/api type-check` exits 0 before old
source files are removed.

### Step 2: Register resource modules at the API composition root

Update `apps/api/src/routes/index.ts` to import each new resource `domain` and
model directly. Add the ten domains to `domainParts` and the ten models to
`installedRoutes`. Keep current API paths such as `/projects` and
`/root-causes` unchanged.

Update every old shared-entity import to the owning folder. This includes QHSSE
PTS, Roles, Notifications, the seed script, and API tests. Remove unused seed
permission codes `view-master-data` and `manage-master-data`; keep all
per-resource permissions. Do not delete existing database rows.

After all imports move, delete `apps/api/src/routes/master-data/`. The API must
not contain a generic master-data module, domain, relation part, or source
import.

**Verify**: run the removed API group check, then
`pnpm --filter @southneuhof/api test`. Both exit 0.

### Step 3: Colocate each web resource with its pages

For every existing web resource folder:

1. Create `<resource>.operations.ts` with its current normalized Hono
   operations and exported types.
2. Create `<resource>.resource.ts` with only that resource's fields, schemas,
   capabilities, route targets, and resource export.
3. Update its list, create, detail, and edit pages to import the local resource.
4. Move resource assertions into `<resource>.resource.spec.ts`. A consumer owns
   lookup assertions. For example, Divisions test their Business Category
   lookup; Work Items test their Project, parent, and UOM lookups.

Use direct resource imports for genuine lookups. Keep the current deferred
`workItems` source getter. Do not create `masterResources`, `masterOperations`,
a shared route-target object, or a resource barrel. Delete
`master-data.resources.ts` and its shared test after every import moves.

**Verify**: `! rg -n 'master-data\.resources' "apps/web/src/routes/(authenticated)/master-data"` exits 0, then the focused web test and web type check exit 0.

### Step 4: Review the move by resource

For each resource, compare pre-move and post-move database table name, entity
schemas, API path, permissions, fields, resource key, route target names, and
FormView use. Only file ownership and imports may change.

Run every command in the commands table. Mark this plan DONE only after review.
Set Plans 002 and 003 to TODO. Their old DONE state does not prove the required
module boundary or field parity.

**Verify**: every command in the commands table exits 0.

## Test plan

- Move existing web resource assertions to their owning resource test files.
- Keep the QHSSE PTS integration test. Change imports only.
- Add no test for a pure file move. Do not add snapshots or browser pixel tests.

## Done criteria

- [ ] `apps/api/src/routes/master-data/` does not exist.
- [ ] Every listed resource has a direct API folder and colocated web resource
  and operations files.
- [ ] The API composition root only imports and registers resource modules.
- [ ] No API source imports or defines a generic master-data module.
- [ ] Frontend `/master-data/...` URLs and route names remain unchanged.
- [ ] Current APIs, permissions, schemas, and resource field contracts are
  unchanged by this refactor.
- [ ] API tests, focused web tests, both type checks, and `git diff --check`
  exit 0.

## STOP conditions

Stop and report if any condition occurs:

- A move changes a database table, generated ID, API URL, API response, field,
  permission, or legacy-parity decision.
- A relation cannot live with the foreign-key owner without a framework change.
- A direct dependency creates a runtime import cycle that a test exposes.
- A required source is outside Scope or needs a framework package change.

## Maintenance notes

Add a future resource in one API folder at `apps/api/src/routes/<resource>/`
and one frontend folder below its route group. The frontend may use semantic
groups such as `master-data`. The API must not recreate this group. Keep
cross-resource rules with the dependent resource.
