# Plan 040: Derive FormView success navigation from resources

> **Implementation instructions**: Follow every step and verification gate. If a STOP condition occurs, stop and report. Update this plan's status row after implementation and review.
>
> **Drift check (run first)**: `git diff --stat 2826b0a..HEAD -- packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/resources/defineResource.ts packages/is-vue-framework/src/hono/resource.ts packages/is-vue-framework/src/components/views/FormView.vue packages/is-vue-framework/src/components/views/__tests__/views.spec.ts packages/is-vue-framework/src/resources/__tests__/resources.spec.ts packages/is-vue-framework/src/hono/__type-tests__/resource.type-test.ts apps/web/src/routes docs/architecture plans/README.md`. Compare any changed in-scope file with Current state; mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — standard mutation results and FormView lifecycle change together.
- **Depends on**: plans/039-canonical-create-routes-and-formview.md
- **Category**: migration
- **Planned at**: commit `2826b0a`, 2026-07-27

## Why this matters

Roles, users, and overtime forms repeat `onSubmitted` only to show feedback and navigate to targets resource actions already own. Overtime additionally unwraps a Hono `{ data }` envelope in its route to recover an ID. Standard resource mutations must instead yield their record, letting FormView derive detail navigation with list fallback.

Exceptional work remains route-owned through an awaited free-form `afterSubmit` hook. It gets a navigation controller; it does not return a route or sentinel. This supports store writes, external fetches, dialogs, exceptional navigation, and intentionally staying on the form without making ordinary routes imperative.

## Current state

- `packages/is-vue-framework/src/contracts/components.ts:49-55` supports generic form result types, but `defineResource` factories use `FormProps<TInput>` and lose them.
- `packages/is-vue-framework/src/resources/defineResource.ts:43-47` types `create` and `update` as `MaybePromise<unknown>`; lines 492-524 forward that result after invalidation.
- `packages/is-vue-framework/src/hono/resource.ts:81-82,135-136` exposes and returns whole Hono create/update envelopes. Standard Sprindle routes return `201 { data }` and `200 { data }` at `packages/sprindle/src/routes/create.ts:6-9` and `update.ts:8-11`.
- Resource action targets already are normalized `RouteLocationRaw` values or identity functions (`defineResource.ts:171-181,332-345`). `DetailView.vue:43-59` is the local precedent: toast plus `router.replace` inside a view shell.
- FormView currently only forwards core success: `<Form v-bind="surface" @submitted="emit('submitted', $event)" ...>` at `FormView.vue:99-103`.
- Roles create pushes list; role/user/overtime edit push detail; overtime create casts `result.data.id`. All five are under `apps/web/src/routes/(authenticated)/`.
- Plan 039's raw `formProps` has no resource, identity extractor, or action target. It stays event-only.

## Commands you will need

| Purpose | Command | Expected |
| --- | --- | --- |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**

- Framework contracts, `defineResource`, Hono adapter, FormView, their tests/type tests/public exports.
- Roles, users, and overtime FormView routes.
- Active migration/architecture docs and `plans/README.md`.

**Out of scope**

- `Form.vue`: stays resource- and router-agnostic.
- DetailView, route naming, action permissions, raw `formProps`, and overtime submit/verify workflows.
- Return-value navigation protocol, compatibility redirects, global toast configuration, and i18n.

## Git workflow

- Preserve unrelated dirty changes. No reset, commit, push, or PR unless instructed.
- Match recent conventional commit style, e.g. `feat(framework): ...`.

## Steps

### Step 1: Return records from standard mutations

Change `ResourceOperations<TRecord,...>` so `create` and `update` resolve `TRecord`, not `unknown`. Thread `TRecord` through create/update FormProps result generics without changing form input or identity overload selection.

Change `createHonoResourceOperations` to parse success once and return the `data` record. Its public mapped types expose `DataOf<HonoResponseOf<...>>`, never `{ data: ... }`. Reject typed Hono standard mutation endpoints whose success data is not an object record. Update fixtures/manual examples so create/update outputs include all declared identity fields. No `unknown` cast and no `result.data` caller reads.

**Verify**: framework type-check exits 0; Hono type fixture proves `await fullOperations.create(...)` is the record.

### Step 2: Add a FormView submission controller

Add resource-mode props `afterSubmit?: (context) => MaybePromise<void>` and `successMessage?: string | false`, defaulting to `Data berhasil disimpan.`. Export generic `FormSubmissionContext<TRecord, TIdentity>` with `record`, `id`, `operation` (`create` or `update`), `defaultTo`, `navigate(to)`, and `preventDefaultNavigation()`.

For update, identity is explicit `id`; for create, call `resource.identity(record)`. Default target is `actions.detail.to(identity)`, then static `actions.list.to`, otherwise undefined. `navigate` accepts only `RouteLocationRaw`, awaits `router.replace`, and marks navigation handled. `preventDefaultNavigation` marks it handled without routing. Hook return values have no navigation meaning.

Raw `formProps` accepts neither hook nor automatic success navigation. Preserve plan 039 create-only/update-only capability checks. If Vue SFC typing cannot retain concrete resource record/identity types, export/test a generic helper type; do not use `any`.

**Verify**: type tests reject raw form plus hook, invalid update identity, and mutation output lacking identity fields. View tests prove FormView never inspects a hook return value for navigation.

### Step 3: Execute effects before derived navigation

Replace direct FormView success forwarding with an awaited resource-success handler. Emit `submitted` as observation with record, show success message unless false, await `afterSubmit`, then default-replace only when hook neither navigated nor prevented it. A targetless resource remains on the form.

If hook throws after persistence, leave FormView mounted, skip default navigation, and show `Data tersimpan, tetapi tindakan lanjutan gagal.`. Do not send this follow-up failure through Form validation/error handling and do not roll back. Follow DetailView router/toast composition; FormView may import vue-router/vue-sonner but no RPC, routes, or app stores.

**Verify**: framework tests prove create/update detail navigation, list fallback, targetless stay, effect-before-default order, hook navigation, prevention, and follow-up failure.

### Step 4: Delete routine app success handlers

Remove `useRouter`, `toast`, `onSubmitted`, and `@submitted` from roles create/edit, users edit, and overtime create/edit. Ordinary templates use only `:resource` and optional `:id`. Preserve overtime's draft wording declaratively with `success-message` if needed; no `result.data` access. No current ordinary route should need `after-submit`.

**Verify**: `rg -n -e '@submitted' -e 'function onSubmitted' -e 'result\.data' apps/web/src/routes` has no FormView-route matches; web type-check exits 0.

### Step 5: Prove boundaries and document behavior

Extend Hono type/runtime tests for unwrapped records. Extend resource tests for record-return FormProps. Extend FormView view/type tests for scalar/composite identity, detail/list/stay selection, free effects, controlled navigation, failure handling, and raw event-only behavior. Use existing memory-router harness; only extend it if route replacement cannot otherwise be asserted.

Document template-only normal forms, record-return invariant, default detail/list rules, `success-message`, and controller-style `after-submit`. State routes own exceptional effects only. Run every Commands gate, `git diff --check`, then `graphify update .`.

**Verify**: all gates exit 0; no application route owns routine post-submit navigation.

## Done criteria

- [ ] Standard create/update operations resolve resource records.
- [ ] Hono standard mutations resolve exact unwrapped records.
- [ ] Resource FormView defaults to detail, then list, then stays put.
- [ ] `afterSubmit` is awaited free-form effect code; only its controller controls navigation.
- [ ] Hook navigation/prevention suppresses default exactly once; follow-up failure is not validation failure.
- [ ] Raw `formProps` remains event-only.
- [ ] Routine app handlers and Hono envelope casts are gone.
- [ ] All six validation commands, `git diff --check`, and `graphify update .` succeed.
- [ ] `plans/README.md` status updates after implementation/review.

## STOP conditions

- A standard mutation lacks object record output or declared identity fields. Repair/approve server contract separately; do not parse route-specific output in FormView.
- Vue SFC hook typing requires `any`, broad casts, or weaker identity constraints.
- A raw form needs inferred routing. Convert it to a resource form or own routing outside FormView.
- A hook needs return-value navigation semantics. Keep controller API.
- Dirty code conflicts with current state, or a validation gate fails twice after scoped correction.

## Maintenance notes

Standard resource mutations promise records because navigation needs identities. New ordinary form routes declare detail/list actions and contain no lifecycle code. `afterSubmit` is exclusively for external effects, dialogs, store writes, or exceptional routing. Reject route handlers that merely toast, route, or unpack Hono envelopes.
