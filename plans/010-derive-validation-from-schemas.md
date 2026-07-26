# Plan 010: Derive form validation from client-safe schemas

> **Implementation instructions**: Build schema selection and validation adapters; do not import server-only API modules into browser runtime code. Manual Zod schemas remain the required fallback when RPC metadata is unavailable. Update the plan index after review.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- packages/is-vue-framework/src packages/contracts packages/sdk packages/sprindle apps/api/src apps/web/src/framework docs/architecture/web-application-architecture.md`; verify architecture hash `ea637318ae94c0bc677012f7fcca332c0df7bf67`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/007-establish-migration-contracts.md`, `plans/009-build-field-catalog-and-renderers.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Validation should be schema-oriented and should not be repeated when an RPC contract already owns a Zod schema. Today the Hono RPC client carries compile-time input types but not client-available runtime schemas, while Sprindle entities do own Zod schemas. This phase creates a safe metadata bridge and predictable selection rules without bundling database/server code into the web app.

## Current state

- `apps/api/src/routes/users/users.entity.ts:18-24` and `products/products.entity.ts:43-58` create Zod create/update/select schemas through `drizzle-zod`.
- `packages/sprindle/src/model/route-types.ts:51-64` stores method/path/kind/bind at runtime; its generic input type is phantom.
- `packages/sprindle/src/model/define-model.ts:42-46` exposes the model entity and routes, but the client has no runtime schema registry.
- `packages/sdk/src/client.ts` uses Hono `hc<AppType>`; it provides compile-time RPC types only.
- Target precedence: explicit component schema > resource operation schema > RPC-derived schema > manual field/catalog composition. No RPC means the resource/app must provide a Zod schema where validation is required.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Sprindle | `pnpm --filter @southneuhof/sprindle test && pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| Framework | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| API | `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/validation/` (create)
- `packages/is-vue-framework/src/contracts/`, `fields/`, and exports
- `packages/sprindle/src/model/` only if schema metadata belongs at model definition
- `packages/contracts/` or another existing browser-safe package for generated/declared schema manifests
- `packages/sdk/` only for client-safe schema lookup typing
- `apps/api/src/routes/**` only to expose existing schemas through the safe manifest
- `apps/web/src/framework/adapters/` for project schema lookup
- related tests and package manifests/lockfile if required

**Out of scope**:

- Importing `apps/api` runtime, Drizzle tables, database clients, environment readers, or auth setup into the browser
- Replacing backend validation
- Visual error rendering or core Form migration
- Requiring every backend/project to use the same response or schema transport

## Git workflow

- Suggested branch: `codex/plan-010-schema-validation`
- Suggested commit: `feat(framework): derive validation from schemas`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Prove the browser boundary before choosing a bridge

Use the production dependency graph/build analyzer to show whether importing the current entity modules would pull Drizzle, `pg`, auth, or environment access into the web bundle. Record the result in a focused test or package-boundary comment. Select one browser-safe design: a small contracts-package schema manifest, or generated schema-only modules. Do not use direct API runtime imports.

**Verify**: a minimal web import of the selected manifest type-checks/builds and a dependency scan contains no `pg`, database connection module, or auth bootstrap.

### Step 2: Expose operation-specific schema metadata

Make resource/route metadata addressable by resource identity and operation (`create`, `update`, and custom mutation where supported). Reuse the existing Zod objects when they are already browser-safe; otherwise generate/declare equivalent schema modules at the contract boundary and add parity tests against server schemas. Keep the adapter optional so non-RPC projects are valid.

**Verify**: tests retrieve distinct create/update schemas for representative users/products resources and return `undefined` for a resource without metadata.

### Step 3: Implement validation selection and issue normalization

Add framework helpers that select a Zod schema by the precedence above, parse safely, and normalize Zod issues into stable field/form issues. Preserve nested paths and multiple issues. Operation-schema selection has a concrete owner: the resource prop factory (plan 013) that wired a create or update submit attaches the matching operation schema to the returned `FormProps`. Form itself never selects between create/update schemas and has no mode.

**Verify**: tests cover explicit override, RPC-derived schema, manual fallback, nested paths, cross-field/refine errors, and no-schema behavior.

### Step 4: Connect catalog metadata without duplicating validation rules

Allow field catalog entries to refer to their schema-derived constraints for renderer inference and error mapping. Do not copy min/max/required rules into presentation config when Zod already owns them. Manual catalog schemas remain supported for offline/non-RPC resources.

Define the interaction with field behavior (plan 009): a field whose `behavior.visible` evaluates false is excluded from the submitted draft, so validation must run against the visibility-filtered draft, and a schema-required field that is behaviorally hidden must surface a clear diagnostic (contradictory definition) rather than an unresolvable user-facing error. Conditional requiredness that depends on other field values belongs in the Zod schema (`refine`/discriminated unions), not duplicated in behavior options; behavior decides presence, schemas decide validity. Where a discriminated union already encodes branch shape, a field absent from the active branch may derive default invisibility as a consistency bonus, never as the only mechanism.

**Verify**: type/runtime tests show a schema change changes validation without editing a field renderer configuration; tests cover validation of a visibility-filtered draft and the hidden-but-required diagnostic.

## Test plan

- Server/client schema parity fixtures.
- Browser-boundary dependency assertion.
- Validation precedence matrix.
- Zod issue normalization for scalar, nested, array, root, refine, and async validation if supported.
- Non-RPC manual schema fixture.

## Done criteria

- [ ] RPC-backed create/update validation can resolve automatically.
- [ ] Non-RPC resources can provide manual Zod schemas.
- [ ] Browser bundle/runtime does not import server/database/auth modules.
- [ ] Schema precedence and normalized issue shapes are tested.
- [ ] All affected package tests/type-checks and web build pass.
- [ ] Index row is `DONE`.

## STOP conditions

- The only apparent implementation imports server-only entity modules into the browser.
- Generated/client schemas cannot be proven equivalent to server schemas.
- Operation schema selection requires a create/update mode prop on Form.
- Zod major versions differ across the boundary and cannot share runtime objects safely.

## Maintenance notes

Reviewers should focus on schema drift and bundle boundaries. If schema generation is selected, its generation/check command must become a CI gate before this plan is considered complete.
