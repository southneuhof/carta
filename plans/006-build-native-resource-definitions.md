# Plan 006: Build native resource definitions and first-class controls

> **Implementation instructions**: Implement resource composition over existing contracts, cores, and shells. A resource describes standard data and native prop bags; routes still own placement and navigation. Do not introduce a composite renderer.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- packages/is-vue-framework/src apps/web/src/framework apps/web/src/main.ts docs/architecture/web-application-architecture.md`; verify architecture hash `6fbc44a012d92c4462e08914ca75b5b4226845c8`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/001-add-project-adapters-and-query-runtime.md`, `plans/002-build-field-catalog-and-renderers.md`, `plans/003-derive-validation-from-schemas.md`, `plans/004-rebuild-core-components.md`, `plans/005-add-resource-view-shells.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Developers should declare a resource once and receive automatic ordinary loading, submission, query ownership, validation, and standard controls. They should also be able to read exactly what data a component receives through `v-bind="resource.table()"`, `v-bind="resource.detail({ id })"`, and `v-bind="resource.form()"` / `v-bind="resource.form({ id })"`. Capabilities should be inferred from defined behavior, with explicit overrides reserved for extraordinary cases.

## Current state

- `apps/web/src/framework/adapters/crud/resources.ts:3-30` creates a compile-time RPC proxy whose runtime value is only a resource-name string.
- `apps/web/src/framework/adapters/crudOperations.ts:26-94` resolves generic `any`-heavy CRUD operation bundles.
- Current config files such as `roles.config.ts:1-10` and `users.config.ts:1-24` use legacy CRUD config plus aliases/filters/form configuration.
- Target resource shape exposes callable `table`/`detail`/`form` prop factories; common operations are inferred from available loaders/submitters, route targets, access, and identity. Standard controls are list/detail/create/update/delete; missing or denied capability hides the control. Excel export and print are deliberately **not** standard controls — apps add them as custom control descriptors, per app or per resource. Explicit per-resource visibility/behavior overrides are escape hatches.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Build/lint | `pnpm --filter @southneuhof/framework-web build && pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/` (create)
- resource/access/control contracts and tests
- framework exports
- `apps/web/src/framework/adapters/resources/` (create)
- `apps/web/src/framework/adapters/index.ts` and plugin installation as necessary

**Out of scope**:

- Migrating roles/users routes or deleting legacy CRUD code
- A renderer that chooses route/view/form state for the developer
- Nested-resource flags/types
- Global permission UI configuration or presentation callbacks in resource data
- Making explicit read/write/load/submit overrides mandatory for basic RPC resources

## Git workflow

- Suggested branch: `codex/plan-006-native-resources`
- Suggested commit: `feat(framework): add native resource definitions`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Implement `defineResource` with exact prop factories

Create a generic builder whose output includes stable identity plus callable `table`, `detail`, and `form` factories returning objects satisfying the public core prop contracts (`TableProps`/`DetailProps`/`FormProps`) exactly. Identity and scoping are call arguments using existing vocabulary only:

- `table(args?)` — optional `{ searchParameters, namespace }`. Parent scoping (e.g. a permissions table under a role) is an ordinary `searchParameters` entry supplied by the route; the framework has no `parent` concept.
- `detail({ id, ... })` — record identity required.
- `form()` returns a create-wired `FormProps` (create submit + create schema); `form({ id })` returns an update-wired one (record load + update submit + update schema); `form({ initialData })` supports prefilled create (clone/draft), where `initialData` follows the universal value-or-`load` rule. Overload signatures make `id` non-nullable so a possibly-undefined route param is a compile error, never a silent create form.

Form itself remains mode-free: the factory wires load/submit/schema before Form sees props, which is also the mechanism plan 003's operation-schema selection relies on. Memoize factory results per normalized arguments so equal calls return structurally equal props; load re-execution is keyed by plan 001 query identity, not closure identity. Call-site overrides need no API: a returned props object is plain, so `v-bind="{ ...roles.form({ id }), submit: custom }"` is the escape hatch. Generate everything directly from field catalog, loaders/submitters, schema lookup, query defaults, identity, and explicit overrides. Do not return adapter-only shapes requiring `ResourceForm`/`ResourceTable` components.

**Verify**: compile-time equality/satisfies tests bind all three factory outputs directly to core components, reject extraneous props, and reject a nullable `id` argument; runtime tests prove memoized structural equality and that `form()` vs `form({ id })` wire create vs update submit/schema.

### Step 2: Add the project RPC resource factory

Under the app adapter folder, replace the string-only proxy for new resources with a typed factory that can derive ordinary list/detail/create/update/delete implementations from RPC route availability. Normalize responses/errors through project adapters. Allow resource-less/local loaders and explicit operation overrides.

**Verify**: fixtures for full CRUD, read-only, update-only, local/offline, and custom override resources infer correct types and make expected RPC calls.

### Step 3: Infer capabilities and standard controls

Derive capability from actual availability: list from table load, detail from identity+detail load, create/update from compatible form submit/load behavior, delete from delete behavior. Combine this with route targets and access policy to create shell control descriptors. Denied or unavailable controls disappear. An explicit override can hide, relabel, redirect, or replace a standard control; custom controls remain normal shell slots/descriptors.

**Verify**: a matrix test covers available/unavailable/denied/explicitly hidden/overridden controls and asserts denied controls are absent, not disabled.

### Step 4: Define route bindings without owning routes

Allow projects/resources to declare optional standard route targets or route-name factories used only for control links. File route components decide which resource prop factory/shell to render and pass scoping identity from route params as ordinary `searchParameters`/`id` arguments. Resource code must not switch on query-string view state.

**Verify**: memory-router tests prove generated links while a static dependency check proves no resource renders a router view or selects a screen.

### Step 5: Add exceptional escape hatches and diagnostics

Support explicit prop overrides, load/submit overrides, `namespace`/local query state, read/write hooks, schema override, custom controls, and capability override. Merge with the precedence fixed in plan 002 and warn for contradictory definitions (for example a visible update control without submit/route behavior).

**Verify**: precedence/diagnostic tests cover every escape hatch and ordinary resource fixtures use none of them.

## Test plan

- Type tests for RPC inference and exact core prop compatibility.
- Capability/control matrix including access denial.
- Ordinary resource fixture demonstrating minimal declaration.
- Extraordinary fixture exercising each escape hatch independently.
- Router-link generation tests without route ownership.

## Done criteria

- [ ] Ordinary RPC resource definitions avoid repeated API calls.
- [ ] `resource.table()/detail({id})/form()/form({id})` outputs bind directly to cores; factory args use only `id`/`searchParameters`/`initialData`/`namespace`.
- [ ] No nested vocabulary, mode, commands, or god renderer exists.
- [ ] Controls derive from behavior/routes/access and denied controls disappear.
- [ ] Escape hatches are optional and deterministic.
- [ ] All validation commands pass and index row is `DONE`.

## STOP conditions

- Direct prop matching requires an adapter component or unsafe `any` cast.
- Resource definitions must inspect current route state to select a screen.
- Capability inference produces visible controls with no executable behavior.
- Permission checks become a security boundary rather than UI policy.

## Maintenance notes

Keep the ordinary resource fixture extremely small; it is the primary DX regression test. Backend authorization remains mandatory regardless of hidden controls.
