# Plan 046: Split the PTS owner permission catalog

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat aa30f1d..HEAD -- apps/api/src/authorization/catalog.ts apps/api/src/authorization/catalog.spec.ts apps/api/src/authorization.ts apps/api/src/__tests__/project-authorization.spec.ts apps/api/src/__tests__/qhsse-pts.spec.ts apps/api/scripts/seed.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `aa30f1d`, 2026-08-13

## Why this matters

PTS form sources currently live under `/qhsse-pts/create-options/*` because
owner lists still use `view-*` as a data gate. The approved owner-list design
splits menu, list, detail, and write verbs, and it moves owner reads and
writes into the system realm. That catalog change must land first. Later
plans cannot compile if they reference `list-divisions` or
`detail-qhsse-pts` before those codes exist.

One module has one realm. `qhsse-pts` cannot hold both system reads and
project workflow writes. This plan splits that module.

## Current state

- `apps/api/src/authorization/catalog.ts:83-203` still has:
  - divisions: `view-divisions`, `manage-divisions`
  - a fake `project-creation` module with only `create-projects`
  - projects, work-items, and project-vendors in the **project** realm with
    `view-*` / `manage-*`
  - qhsse-pts in the **project** realm with `view-qhsse-pts` and
    `show-qhsse-pts`
- `apps/api/src/authorization/catalog.spec.ts:31-46` asserts
  `create-projects` is system and that `view-projects`, `manage-projects`,
  and every qhsse-pts code are project.
- `apps/api/src/authorization.ts:125-187` already has `hasProjectCoverage`
  (assignment only) and `accessibleProjectIds(userId, permissionCode)`
  (assignment plus a **project** permission). Default owner lists need the
  first. PTS narrower lists need the second.
- `apps/api/src/__tests__/project-authorization.spec.ts:58-72` seeds
  `view-projects`, `manage-projects`, `view-qhsse-pts`, and `show-qhsse-pts`
  as project codes.
- `apps/api/src/__tests__/qhsse-pts.spec.ts:46-61` seeds every PTS code,
  including `show-qhsse-pts`, onto one **project** module.
- `apps/api/scripts/seed.ts:53-76` maps each catalog permission to the
  super-administrator or project-administrator role by **module realm**.
  After this plan, system owner codes go to the super-administrator. PTS
  workflow codes stay on the project-administrator.

Approved contract:
`docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`.

Required correction to that spec, made here because one module cannot have
two realms:

| Module | Realm | Codes |
| --- | --- | --- |
| `qhsse-pts` | system | `view-qhsse-pts`, `list-qhsse-pts`, `detail-qhsse-pts` |
| `qhsse-pts-workflow` | project | `create-qhsse-pts`, `update-qhsse-pts`, `delete-qhsse-pts`, and the remaining disposition / close codes |

Do not keep `show-qhsse-pts`. Do not add `access-project`.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Catalog tests | `pnpm --filter @southneuhof/api test -- catalog.spec.ts` | exit 0 |
| Auth tests | `pnpm --filter @southneuhof/api test -- project-authorization.spec.ts` | exit 0 |
| PTS tests | `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts` | exit 0 |
| Type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |

## Suggested implementation toolkit

- Read `docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`
  before editing the catalog.
- Match catalog style in `apps/api/src/authorization/catalog.ts`.
- Match helper style in `apps/api/src/authorization.ts`.

## Scope

**In scope**:

- `apps/api/src/authorization/catalog.ts`
- `apps/api/src/authorization/catalog.spec.ts`
- `apps/api/src/authorization.ts`
- `apps/api/src/__tests__/project-authorization.spec.ts`
- `apps/api/src/__tests__/qhsse-pts.spec.ts`
- `apps/api/scripts/seed.ts` only if a compile or seed mapping breaks
- `docs/superpowers/specs/2026-08-13-owner-list-sources-design.md` — add the
  `qhsse-pts` / `qhsse-pts-workflow` module split in the catalog section

**Out of scope**:

- Owner list routes, PTS create-options, web resources, menus
- Remaining catalog modules from the addendum (roles, uoms, …)
- Framework package code
- `requireProjectRecord` callers except test fixtures in this plan

## Git workflow

- Branch: stay on the current branch unless the operator asks otherwise
- Commit message style: `fix(api): split owner permission catalog`
- Do NOT push or open a PR unless asked

## Steps

### Step 1: Rewrite the PTS owner catalog

In `apps/api/src/authorization/catalog.ts`:

1. On `users`, add `list-users` and `detail-users`. Keep `create-users` and
   `update-users`. Do not add `delete-users`.
2. On `divisions`, `pts-work-categories`, and `root-causes`, replace
   `manage-*` with `list-*`, `detail-*`, `create-*`, `update-*`, and
   `delete-*`. Keep `view-*`.
3. Delete the `project-creation` module. Move `create-projects` onto
   `projects`.
4. Change `projects`, `work-items`, and `project-vendors` to `realm:
   "system"`. Give each `view-*`, `list-*`, `detail-*`, `create-*`,
   `update-*`, and `delete-*`. Remove `manage-*`.
5. Change `qhsse-pts` to `realm: "system"` with only `view-qhsse-pts`,
   `list-qhsse-pts`, and `detail-qhsse-pts`.
6. Add `qhsse-pts-workflow` with `realm: "project"` and the remaining PTS
   write / action codes. Remove `show-qhsse-pts`.

Update `catalog.spec.ts`:

- `create-projects` stays system.
- `view-projects`, `list-projects`, `detail-projects`, `update-projects`,
  `delete-projects`, `view-work-items`, `view-project-vendors`,
  `view-qhsse-pts`, `list-qhsse-pts`, and `detail-qhsse-pts` are system.
- Workflow codes (`create-qhsse-pts` through `close-qhsse-pts`) are project.
- Removed codes include `show-qhsse-pts`, `manage-divisions`,
  `manage-projects`, `manage-work-items`, `manage-project-vendors`,
  `manage-pts-work-categories`, and `manage-root-causes`.

**Verify**: `pnpm --filter @southneuhof/api test -- catalog.spec.ts` → exit 0

### Step 2: Add assignment-only project coverage

In `apps/api/src/authorization.ts`, add `coveredProjectIds(userId)` next to
`hasProjectCoverage`. It must return distinct project ids covered by any
active project-role assignment. It must **not** join permissions.

Keep `accessibleProjectIds(userId, permissionCode)` for a project-realm
permission such as `create-qhsse-pts`. Do not point default lists at it.

Add a small unit/integration assertion in
`apps/api/src/__tests__/project-authorization.spec.ts`: a user assigned only
to project A gets `[A]` from `coveredProjectIds`, and
`accessibleProjectIds(user, 'create-qhsse-pts')` stays empty unless that
project role has `create-qhsse-pts`.

**Verify**: `pnpm --filter @southneuhof/api test -- project-authorization.spec.ts` → exit 0

### Step 3: Stop seeding removed project read codes

In `apps/api/src/__tests__/project-authorization.spec.ts` and
`apps/api/src/__tests__/qhsse-pts.spec.ts`:

- Stop inserting `show-qhsse-pts`, `view-projects`, `manage-projects`,
  `view-work-items`, `manage-work-items`, `view-project-vendors`,
  `manage-project-vendors`, and `view-qhsse-pts` as **project** permissions.
- Keep seeding `create-qhsse-pts` and the other workflow codes on a project
  module / role. That is enough for current PTS write tests.
- If a test still calls `accessibleProjectIds(user, 'view-projects')` or
  `requireProjectRecord(..., 'view-projects')`, leave the call for plan 047
  only if it still typechecks. If TypeScript fails because the code is no
  longer a `PermissionCode` in the project sense, or if the helper now
  rejects a system code, change that fixture call to `coveredProjectIds` or
  `create-qhsse-pts` as the test actually needs. Do not rewrite owner routes
  in this plan.

`scripts/seed.ts` already maps by module realm. After step 1 it will give
system owner codes to the super-administrator and workflow codes to the
project-administrator. Do not invent a second operational role.

**Verify**:
`pnpm --filter @southneuhof/api test -- project-authorization.spec.ts qhsse-pts.spec.ts`
→ exit 0
`pnpm --filter @southneuhof/api type-check` → exit 0

### Step 4: Record the module split in the owner-list spec

In `docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`, replace
the sentence that says only `qhsse-pts` stays in the project realm with the
two-module table from this plan. Do not change other locked rules.

**Verify**: `rg "qhsse-pts-workflow" docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`
→ one or more matches

## Test plan

- Catalog uniqueness and realm resolution already exist. Extend them.
- Add or adjust one coverage test: assignment without a workflow permission
  still returns the project from `coveredProjectIds`.
- Existing PTS create / action tests must still pass. They only need
  project-realm workflow codes on the fixture role.

Verification:
`pnpm --filter @southneuhof/api test -- catalog.spec.ts project-authorization.spec.ts qhsse-pts.spec.ts`
→ all pass

## Done criteria

- [ ] `pnpm --filter @southneuhof/api test -- catalog.spec.ts` exits 0
- [ ] `pnpm --filter @southneuhof/api type-check` exits 0
- [ ] `rg "show-qhsse-pts|project-creation|manage-divisions|manage-projects" apps/api/src/authorization/catalog.ts` returns no matches
- [ ] `rg "qhsse-pts-workflow" apps/api/src/authorization/catalog.ts` matches
- [ ] `coveredProjectIds` exists in `apps/api/src/authorization.ts`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live catalog no longer matches the excerpts.
- A module other than the PTS owners must change for this plan to compile.
- `accessibleProjectIds` cannot stay permission-specific without a schema
  change.
- Seed mapping by realm would grant a project workflow code to the
  super-administrator or a system menu code to the project-administrator.

## Maintenance notes

- Reviewers must confirm `projects` / `work-items` / `project-vendors` /
  `qhsse-pts` are system modules and that only `qhsse-pts-workflow` remains
  project.
- Plan 047 will switch owner routes from `view-*` / `requireProjectRecord`
  to `list-*` / `coveredProjectIds`.
- Do not add `/me.projectViews`. Menus stay on system `view-*`.
