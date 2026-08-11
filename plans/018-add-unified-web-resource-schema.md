# Plan 018: Add the unified web resource schema

> **Implementation instructions**: Follow each step. Run each check before the next step. Update `plans/README.md` only after implementation and review.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- packages/is-vue-framework/src/contracts packages/is-vue-framework/src/resources packages/is-vue-framework/src/validation packages/is-vue-framework/src/index.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

The current resource receives separate `schemas` and `validators` objects. The approved design requires one transport-neutral schema value that owns record, query, create, update, identity, and standard frontend validation types. This plan adds that value only. It does not change resources or routes.

## Current state

- `packages/is-vue-framework/src/contracts/resource.ts:20-35` defines `ResourceSchemas` and `ResourceValidators` as separate peer objects.
- `packages/is-vue-framework/src/resources/defineResource.ts:419-425` selects a schema from the resource, an adapter, or a manual fallback.
- The approved design at `docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md:68-77` says the framework core owns `defineSchema`, schema type extractors, and validation execution, with no Hono import.

Current split:

```ts
schemas?: ResourceSchemas<TRecord, TQuery, TCreate, TUpdate>
validators?: ResourceValidators<TCreate, TUpdate>
```

Target public shape:

```ts
const schema = defineSchema({
  identity: 'id',
  record: { schema: recordSchema },
  query: { schema: querySchema },
  create: { schema: createSchema, validators: createValidators },
  update: { schema: updateSchema, validators: updateValidators },
})
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Hono boundary | `rg -n "from ['\"]hono|hono/client" packages/is-vue-framework/src/contracts/schema.ts packages/is-vue-framework/src/resources/defineSchema.ts` | no matches |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/schema.ts` (create)
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/resources/defineSchema.ts` (create)
- `packages/is-vue-framework/src/resources/index.ts`
- `packages/is-vue-framework/src/resources/__type-tests__/schema.type-test.ts` (create)
- `packages/is-vue-framework/src/resources/__tests__/schema.spec.ts` (create only if runtime identity needs a check)

**Out of scope**:

- `defineResource` behavior
- View components
- Hono helpers and app adapters
- Route or module migration
- Removal of old schema types

## Git workflow

- Branch: `codex/018-unified-resource-schema`
- Commit: `feat(framework): add unified resource schema`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Define the contract

Add `WebResourceSchema`, part definitions, and extractors for record, query, create, update, and identity. A part can have no runtime validation schema. Create and update parts can own validator inputs. Keep all types backend-neutral.

**Verify**: run the framework type check. It must pass before the builder is added.

### Step 2: Add `defineSchema`

Add one identity builder that returns its input without hidden transport behavior. Preserve exact literal and inferred types. Export it from the normal framework entry point.

**Verify**: add type checks for inferred manual schemas, an explicit `WebResourceSchema` contract, absent runtime schemas, and different create/update inputs. The framework type check must exit 0.

### Step 3: Test the public boundary

Test that the builder keeps the same runtime object and that the new core files do not import Hono. Do not test TypeScript with runtime assertions.

**Verify**: run all commands in the table.

## Test plan

- Use `packages/is-vue-framework/src/hono/__type-tests__/resource.type-test.ts` only as a file-layout example.
- Cover exact type extraction and validator ownership in the new type test.
- Add one runtime test only for real runtime behavior.

## Done criteria

- [ ] `defineSchema` and all schema extractors are public.
- [ ] Schema parts can omit runtime validation.
- [ ] Create and update validators belong to their schema parts.
- [ ] No new core file imports Hono.
- [ ] Framework tests and type check pass.
- [ ] Only in-scope files changed.

## STOP conditions

- Stop if the contract needs a Hono type in framework core.
- Stop if a second schema builder appears necessary.
- Stop if implementation needs a `schemas` compatibility converter.

## Maintenance notes

Keep schema extraction structural. Do not add custom action schemas later; the approved design treats custom actions as normal application functions.
