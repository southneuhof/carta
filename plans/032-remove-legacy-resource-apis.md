# Plan 032: Remove all legacy resource and Hono framework APIs

> **Implementation instructions**: Run this plan only after every module checkpoint in plans 023-031 and PTS removal in plan 022 is complete. Delete old APIs. Do not keep aliases, overloads, converters, or deprecated exports.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- packages/is-vue-framework apps/web/src/framework apps/web/src/routes pnpm-lock.yaml`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans 018-031, including every cohort checkpoint
- **Category**: tech-debt
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Migration coexistence is temporary. If the old resource signature, operations helper, Hono package entry, or `defineFields` helper remains public, the codebase will have two valid architectures and new modules can select the wrong one. This plan makes the approved design the only path.

## Current state

- `resources/index.ts:1-32` exports `defineResourceOperations` and the old capability/surface types.
- `contracts/resource.ts:20-35` defines separate resource schemas and validators.
- `fields/index.ts:1-2` exports `defineFields`.
- `package.json:23-33` exports `./hono` and declares optional Hono peer metadata.
- `src/hono/resource.ts` owns Hono types and runtime helpers that plan 021 replaces in app code.
- Current scans also find `defineFields` in framework fixtures and custom app surfaces. By this plan, migrated resources must already be clean.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Legacy symbol scan | `rg -n "defineResourceOperations|createHonoResourceOperations|parseHonoResponse|HonoRequestOf|HonoResponseOf|ResourceSchemas|ResourceValidators|defineFields|@southneuhof/is-vue-framework/hono" apps/web/src packages/is-vue-framework/src packages/is-vue-framework/package.json` | no matches |
| Old resource shape | `rg -n "capabilities:|schemas:|validators:|table: \{ fields: \[|detail: \{ fields: \[|form: \{ fields: \[" 'apps/web/src/routes/(authenticated)' -g '*.resource.ts'` | no matches |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | no new failure |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Root build | `pnpm build` | exit 0 |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/defineResource.ts`, `resources/index.ts`, and resource tests/type tests
- `packages/is-vue-framework/src/contracts/resource.ts`, `contracts/index.ts`
- Delete `packages/is-vue-framework/src/hono/`
- `packages/is-vue-framework/package.json`, `pnpm-lock.yaml`
- Delete `packages/is-vue-framework/src/fields/defineFields.ts`; update `fields/index.ts`, public/type tests, and remaining helper-only fixtures
- Remaining `defineFields` app fixtures or custom surfaces, including `apps/web/src/framework/acceptance/QueryOwnershipFixture.vue` and the project-role route if still present
- `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts`

**Out of scope**:

- Core field resolution, behavior, display, defaults, and renderer contracts
- New resource features
- Module behavior changes
- API Hono dependencies
- Backward compatibility

## Git workflow

- Branch: `codex/032-remove-legacy-resources`
- Commit: `refactor(framework): remove legacy resource APIs`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Prove all consumers migrated

Run both legacy scans before editing. Any match in an application resource or operations file means a module plan is incomplete. Stop instead of cleaning that module here.

**Verify**: only known framework definitions, tests, and helper-only custom fixtures can match.

### Step 2: Delete the old resource path

Remove the one-argument `defineResource` implementation, `defineResourceOperations`, old operation metadata extractors, old capability input types, old surface selection types, and separate resource schema/validator contracts. Keep only types and registry behavior required by the per-action API.

**Verify**: focused resource tests and framework type check pass.

### Step 3: Delete framework Hono support

Delete `src/hono`, remove the package export, peer dependency, peer metadata, and unused Hono dev dependency. Update the lockfile through the normal package-manager path. Confirm app code uses only `apps/web/src/framework/hono`.

**Verify**: framework type check and web type check pass; the legacy symbol scan has no Hono framework matches.

### Step 4: Delete `defineFields`

Replace remaining helper-only uses with typed plain objects that satisfy existing `FieldsInput` or exact action-field types. Delete the helper and its exports. Do not remove field resolution or behavior layers used by core components.

**Verify**: the legacy symbol scan has no `defineFields` match and all framework tests pass.

### Step 5: Tighten public and boundary tests

Update public API tests to assert the new exports and absence of deleted exports. Change the web boundary test from migration coexistence to final-state enforcement.

**Verify**: run all commands in the table.

## Test plan

Reuse existing resource, public API, field resolution, Hono adapter, and web boundary tests. Add negative compile-time checks for deleted public shapes only where the existing type-test harness supports them. Do not retain deleted code to make a negative test possible.

## Done criteria

- [ ] Only the two-argument unified `defineResource` API exists.
- [ ] `defineResourceOperations`, old peer schema/validator/surface types, and `defineFields` are absent.
- [ ] Framework package has no Hono source, export, peer, or dev dependency.
- [ ] App Hono adapters remain.
- [ ] All package and root checks pass.

## STOP conditions

- Stop if any application module checkpoint is incomplete.
- Stop if a deleted helper still has a real use that is not a type-only convenience; report the use.
- Stop if removing Hono changes an API package dependency.
- Stop if a compatibility layer appears necessary.

## Maintenance notes

Review new exports closely. Public API growth must follow a demonstrated application need, not migration convenience.
