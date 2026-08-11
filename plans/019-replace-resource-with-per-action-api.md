# Plan 019: Replace the resource definition with per-action blocks

> **Implementation instructions**: Follow each step and keep the old call signature available only until plan 040 removes it. Do not add a converter between signatures.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- packages/is-vue-framework/src/resources packages/is-vue-framework/src/contracts/resource.ts`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/018-add-unified-web-resource-schema.md`
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

The current API splits one operation across `capabilities`, `fields`, `table`, `detail`, `form`, `schemas`, and `validators`. The new API must make each standard action readable in one block. The returned action object must be both the View prop bag and the only holder of `run`.

## Current state

- `packages/is-vue-framework/src/resources/defineResource.ts:260-278` defines the split input.
- `packages/is-vue-framework/src/resources/defineResource.ts:481-554` builds table, detail, and form surfaces from peer properties.
- `packages/is-vue-framework/src/resources/defineResource.ts:556-565` performs standard invalidation.

Current input:

```ts
{ fields, table, detail, form, schemas, validators, capabilities }
```

Target input and use:

```ts
const users = defineResource(usersSchema, { key: 'users', actions: {
  list: { run, fields, permission, route },
  detail: { run, fields, permission, route },
  create: { run, fields, permission, route },
  update: { run, fields, permission, route },
  delete: { run, permission },
  verify: { run: verifyUser },
} })

users.list().run(context)
users.detail({ id }).run()
users.create().run(input)
users.update({ id }).run(input)
users.delete({ id }).run()
users.actions.verify.run(input)
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/resources/__tests__/resources.spec.ts` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/resources/__type-tests__/resource-actions.type-test.ts` (create)
- `packages/is-vue-framework/src/resources/index.ts`
- `packages/is-vue-framework/src/contracts/resource.ts` only for types used by the new signature

**Out of scope**:

- View components
- App Hono code
- Existing module call sites
- Deletion of the old signature or old exports
- Custom action permission, route, schema, method, or invalidation metadata

## Git workflow

- Branch: `codex/019-per-action-resource`
- Commit: `refactor(framework): add per-action resources`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Define exact action contracts

Define list, detail, create, update, and delete action inputs. Each standard action owns `run`, complete fields when the View needs them, `permission`, and `route`. A custom action accepts only `{ run }`. Do not add `.props`, `.view`, a factory-level `.run`, or a second execution namespace.

**Verify**: type tests must reject missing `run`, wrong identity/input types, custom metadata, and fields outside the schema record/input.

### Step 2: Build standard action objects

Add the two-argument `defineResource(schema, definition)` path. Map action `run` to the existing core `load` or `submit` props. Keep namespace, access, route registration, identity extraction, memoization, and standard invalidation behavior. Make the returned standard action object contain `run` and View props together.

**Verify**: focused tests must cover all five standard actions, denied access, route generation, one execution path, and collection/record invalidation.

### Step 3: Expose custom actions plainly

Return custom actions under `resource.actions.<name>.run`. Do not register them as route capabilities and do not invalidate for them.

**Verify**: a test must show that a custom action runs, has no extra runtime keys, and does not cause automatic invalidation.

### Step 4: Keep migration coexistence narrow

Keep the old signature as its existing implementation until all modules migrate. Do not make either signature convert into the other. Plan 040 will delete the old path.

**Verify**: existing framework tests and the new action tests pass.

## Test plan

- Add compile-time coverage for exact standard action keys, identity and input types, View fields, and custom action limits.
- Add runtime coverage for all five standard actions, route/access behavior, memoization, mutation invalidation, and a custom action with no invalidation.
- Keep the existing old-signature tests only until plan 032 deletes that path.
- Verification: focused resource tests, full framework tests, and framework type check all exit 0.

## Done criteria

- [ ] Every standard action block is locally complete.
- [ ] The returned standard action object owns the only standard `run` reference.
- [ ] Custom actions expose only `run`.
- [ ] Standard invalidation and access checks still work.
- [ ] Both temporary call signatures type-check without a compatibility converter.
- [ ] All framework checks pass.

## STOP conditions

- Stop if the new path must read old `capabilities`, `table`, `detail`, or `form` data.
- Stop if custom actions need framework metadata for a current approved use case.
- Stop if View props cannot be exact without changing a core component contract; report that contract before changing it.

## Maintenance notes

This temporary two-signature state is for ordered migration only. Do not document the old signature as supported.
