# Plan 021: Add app-owned Hono resource adapters

> **Implementation instructions**: Put all Hono contract and request details in `apps/web`. Do not add Hono imports to new framework core files.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- apps/web/src/framework packages/is-vue-framework/src/hono packages/is-vue-framework/src/resources`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/018-add-unified-web-resource-schema.md`, `plans/019-replace-resource-with-per-action-api.md`
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Hono RPC is an application transport choice. The current package owns Hono type extraction, request serialization, response parsing, and standard operation creation in `packages/is-vue-framework/src/hono/resource.ts`. The approved design moves these concerns to `apps/web` and leaves framework core transport-neutral.

## Current state

- `apps/web/src/framework/rpc.ts:1-8` owns the typed client.
- `apps/web/src/framework/adapters/data/normalize.ts:15-63` owns wire normalization.
- `packages/is-vue-framework/src/hono/resource.ts:1-17` exports Hono request/response types and parsing.
- `packages/is-vue-framework/src/hono/resource.ts:101-154` derives and creates conventional resource operations.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Adapter tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/hono` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Core boundary | `rg -n "from ['\"]hono|hono/client" packages/is-vue-framework/src/resources packages/is-vue-framework/src/contracts/schema.ts` | no matches |

## Scope

**In scope**:

- `apps/web/src/framework/hono/contracts.ts` (create)
- `apps/web/src/framework/hono/actions.ts` (create)
- `apps/web/src/framework/hono/response.ts` (create)
- `apps/web/src/framework/hono/contracts.type-test.ts` (create)
- `apps/web/src/framework/hono/actions.spec.ts` (create)
- `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts`

**Out of scope**:

- Application module migration
- Deletion of `packages/is-vue-framework/src/hono`
- New wire formats or error shapes
- A transport interface for non-Hono applications

## Git workflow

- Branch: `codex/021-app-hono-adapters`
- Commit: `refactor(web): own Hono resource adapters`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Add the type-only contract adapter

Add `AppResourceContract<TRoute>` and local request/response helpers. Derive the standard record, query, create, update, and identity types from the typed Hono route. Emit no runtime keys and import no Vue code.

**Verify**: type fixtures cover full CRUD, read-only, missing list, and exact create/update input types.

### Step 2: Add the standard action helper

Move the current request serialization and data normalization pattern into an app helper that returns typed standard `run` functions. Keep cancellation for list and detail, composite identity serialization, non-empty query filtering, and thrown non-success payloads.

**Verify**: adapter tests match the current `packages/is-vue-framework/src/hono/__tests__/resource.spec.ts` observable cases.

### Step 3: Add the general response helper

Add an app-level typed response parser for custom endpoints. This replaces `parseHonoResponse` during module migration. It must parse once and throw the parsed error payload for a non-success response.

**Verify**: test success status typing and failed response behavior.

### Step 4: Add migration boundary checks

Change the web boundary test so migrated schema files cannot import Hono, resource files cannot call raw RPC, and migrated operation files are not required. Do not require all modules to be migrated yet.

**Verify**: run all commands in the table.

## Test plan

- Port the observable Hono adapter cases to app-level tests: exact type keys, query and identity serialization, response normalization, failed payloads, and abort signals.
- Add contract type fixtures for full CRUD, read-only routes, and distinct create/update input types.
- Add a response-helper test for successful and failed status parsing.
- Verification: focused adapter tests and both type checks exit 0.

## Done criteria

- [ ] `AppResourceContract` is app code.
- [ ] Standard Hono action functions are app code.
- [ ] Custom endpoint response parsing is app code.
- [ ] New framework schema/resource files have no Hono dependency.
- [ ] Existing modules still compile before their own plans run.

## STOP conditions

- Stop if the app helper needs framework View types.
- Stop if one helper cannot support the existing conventional Hono resource routes.
- Stop if a module must be migrated to test the adapter; use a local fixture instead.

## Maintenance notes

Plain service and fetch resources must call their functions directly. Do not force them through this Hono helper.
