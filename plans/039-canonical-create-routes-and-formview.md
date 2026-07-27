# Plan 039: Make create routes and FormView contracts canonical

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**: `git diff --stat 2826b0a..HEAD -- packages/is-vue-framework/src/components/views/FormView.vue packages/is-vue-framework/src/components/views/__tests__/views.spec.ts packages/is-vue-framework/src/resources/__tests__/resources.spec.ts apps/web/src/routes apps/web/src/router/legacy-urls.ts apps/web/src/router/__tests__/legacy-urls.spec.ts apps/web/src/route-map.d.ts docs/architecture/resource-migration-guide.md docs/architecture/web-application-architecture.md plans/README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — route names and a public Vue component prop contract both change atomically.
- **Depends on**: plans/038-split-resource-definitions-and-derive-types.md
- **Category**: migration
- **Planned at**: commit `2826b0a`, 2026-07-27

## Why this matters

The application calls create screens `new`, although resource behavior and
actions call them `create`. It also makes route components manufacture
`FormProps` before passing them to `FormView`, unlike resource-first
`DetailView`, which receives an explicit resource and identity. This plan makes
the terms and ownership consistent with one clean break: create files, URLs,
and route names use `create`; FormView owns normal resource-form projection;
and the previous `form` prop spelling is removed instead of supported as a
compatibility branch.

The raw-composition escape hatch remains deliberate, but receives the new,
explicit `formProps` prop name. That gives advanced callers the same composed
surface option as DetailView's `detail` input while ensuring `FormView :form`
is not a valid legacy API.

## Current state

- `packages/is-vue-framework/src/components/views/FormView.vue` is the Form
  shell. It currently requires raw props (`form: FormProps`) and forwards them:

  ```ts
  // packages/is-vue-framework/src/components/views/FormView.vue:13-19
  const props = defineProps<{
    form: FormProps
    title?: string
    description?: string
    submitLabel?: string
    controls?: readonly ViewControl[]
  }>()
  ```

  ```vue
  <!-- packages/is-vue-framework/src/components/views/FormView.vue:38-43 -->
  <slot name="body" v-bind="{ form: props.form }">
    <Form ref="instance" v-bind="props.form" ...>
  ```

- `packages/is-vue-framework/src/components/views/DetailView.vue:19-40` is
  the established pattern. Its resource branch requires `resource` and `id`,
  derives `resource.detail({ id, ...detailOptions })`, and retains a separate
  raw `detail` composition branch. FormView must mirror that ownership model,
  not copy DetailView's delete lifecycle.

- `packages/is-vue-framework/src/resources/defineResource.ts:289-305` already
  exposes the exact create/update factory overloads needed by FormView:

  ```ts
  type CreateForm<TCreate extends object> = {
    (): FormProps<TCreate>
    (args: { initialData?: Partial<TCreate>; searchParameters?: Record<string, unknown> }): FormProps<TCreate>
  }
  type UpdateForm<TUpdate extends object, TIdentity extends RecordIdentity> = {
    (args: { id: TIdentity; initialData?: Partial<TUpdate>; searchParameters?: Record<string, unknown> }): FormProps<TUpdate>
  }
  ```

- Existing route calls use the old FormView projection:

  ```vue
  <!-- apps/web/src/routes/(authenticated)/settings/roles/new.route.vue:17 -->
  <FormView title="Tambah Role" :form="roles.form()" @submitted="onSubmitted" />

  <!-- apps/web/src/routes/(authenticated)/settings/roles/[roleId]/edit.route.vue:22 -->
  <FormView title="Ubah Role" :form="roles.form({ id: roleId })" @submitted="onSubmitted" />
  ```

- Filesystem routing mechanically derives names. The two create screens are
  `settings/roles/new.route.vue` and `hr/overtimes/new.route.vue`; generated
  `apps/web/src/route-map.d.ts:62-64,97-99` therefore declares
  `hr-overtimes-new` and `settings-roles-new`. Resource actions target those
  names in their colocated resource definitions.

- `apps/web/src/router/legacy-urls.ts:38,57` currently translates the retired
  query-state `create` view to `/new`. This plan must not replace it with a
  `/new` alias or a redirect to `/create`: historical create-view mappings are
  removed, so they fall through to the existing unknown-view list fallback.

- Live architecture docs currently state the opposite convention:
  `docs/architecture/resource-migration-guide.md:161,182` and
  `docs/architecture/web-application-architecture.md:66-79` name `new` as a
  literal static segment. Update these documents and the current convention in
  `plans/README.md`; do not rewrite completed historical plans or generated
  proof artifacts as though history used the new convention.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; FormView resource/raw tests pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; invalid legacy FormView props rejected |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0; route/resource/legacy tests pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; generated create route names resolve |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0; regenerates `apps/web/src/route-map.d.ts` |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/components/views/FormView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/components/views/__type-tests__/` when needed
  to prove old/new FormView prop acceptance
- Rename `apps/web/src/routes/(authenticated)/settings/roles/new.route.vue` to
  `create.route.vue`, and rename the corresponding overtime route.
- The roles/overtimes resource definitions and their resource specs.
- The three edit route components and two renamed create components that mount
  FormView.
- `apps/web/src/router/legacy-urls.ts` and its tests.
- Generated `apps/web/src/route-map.d.ts` (only through the route generator).
- `docs/architecture/resource-migration-guide.md`,
  `docs/architecture/web-application-architecture.md`, and the live
  convention/dependency notes in `plans/README.md`.

**Out of scope**

- `DetailView` API or its raw `detail` composition branch. It remains the
  model for FormView's two intentional forms, not a migration target.
- `Form.vue`, resource `form()` factory behavior, schemas, submit events,
  success toasts, and route-owned post-submit navigation.
- Historical `plans/0xx-*.md` files and `plans/proofs/**`; they document the
  prior decision and are not active architecture documentation.
- Vendor files under `apps/web/src/assets/**` and unrelated uses of the English
  word `new`.
- Any `/new` redirect, alias, deprecated prop normalization, warning, or
  compatibility shim.

## Git workflow

- Work on the current branch; do not reset or overwrite existing unrelated
  changes in the dirty tree.
- Match recent conventional commits such as `refactor(framework): ...`.
- Do not push, commit, or open a PR unless instructed.

## Steps

### Step 1: Define FormView's two intentional input forms

In `FormView.vue`, replace the required `form` prop with a discriminated
resource-first/raw-composition contract.

- Resource form: accept `resource`, optional `id`, and a narrowly named
  `formOptions` containing only factory arguments (`initialData` and
  `searchParameters`). When `id` is absent, derive `resource.form()` or
  `resource.form(formOptions)`; when present, derive
  `resource.form({ ...formOptions, id })`.
- Make capabilities type-exact as in `defineResource`: create-only resources
  may mount without `id`; update-only resources require `id`; resources with
  both operations support both cases. An undefined route parameter must remain
  a type error, never silently choose create.
- Raw composition: accept `formProps: FormProps`, with `resource`, `id`, and
  `formOptions` forbidden in that branch. This is the deliberate escape hatch
  for preloaded/custom-submit forms. Do **not** name it `form`: that old prop
  must fail type-checking.
- Keep title, description, controls, submitLabel, slots, `submitted`, and
  `error` behavior unchanged. Derive one computed `surface`/form value and use
  it in the body-slot scope and forwarded `<Form>` props.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.

### Step 2: Replace shell tests with contract and behavior coverage

Update `components/views/__tests__/views.spec.ts` and
`resources/__tests__/resources.spec.ts` to mount FormView resource-first for
both create and update. Use existing `ordinaryResource()` test fixtures and
the existing core mount harness; do not construct an adapter layer.

Add coverage for:

- create `:resource` calls create with the draft;
- update `:resource :id` loads then calls update with that identity;
- `formProps` raw composition still forwards custom load/submit props;
- resource `formOptions` reaches the resource factory;
- no test or source passes a `form` prop to FormView.

Add/extend a compile-time test under `components/views/__type-tests__/` that
accepts resource create/update and `formProps`, but marks `form` with
`@ts-expect-error`. Include create-only/update-only capability cases if the
component prop types cannot otherwise prove them.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` → both exit 0.

### Step 3: Rename create routes and targets atomically

Rename only the roles and overtime filesystem route components from
`new.route.vue` to `create.route.vue`. Update:

- resource action targets from `settings-roles-new` / `hr-overtimes-new` to
  `settings-roles-create` / `hr-overtimes-create`;
- route and resource tests asserting those targets;
- all five application FormView mounts to resource-first syntax:
  create screens use `:resource`, edit screens use `:resource :id`;
- route-map declarations only by running the generator/build after the file
  rename—never hand-edit its route records.

Do not add old route files, redirects, aliases, or duplicate action targets.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/framework-web build` → both exit 0; `apps/web/src/route-map.d.ts` contains only the two `*-create` route names and `/create` paths.

### Step 4: Remove obsolete create compatibility mapping and document truth

In `legacy-urls.ts`, remove the roles/overtime `create` entries instead of
translating them to a new URL. Update tests so legacy query-state `create`
falls back to its list route with the existing unknown-view diagnostic. Keep
list/detail/update handling untouched.

Update active documentation to use `create.route.vue`, `/create`, and
`*-create`; describe FormView as resource-first with `:resource` and optional
`:id`, and document `:form-props` as the raw composition escape hatch. Amend
the current naming invariant in `plans/README.md` from `new` literal to
`create` literal. Do not present old routes or old props as deprecated or
supported—the break is complete.

**Verify**: `rg -n -g '!assets/**' -g '!route-map.d.ts' -e 'new\.route\.vue' -e 'settings-roles-new' -e 'hr-overtimes-new' -e '/new' apps/web/src docs/architecture` → no matches; `rg -n 'FormView[^\n]*:form=' apps/web/src packages/is-vue-framework/src docs/architecture` → no matches.

### Step 5: Run full release gates and review cleanup

Run every command in "Commands you will need". Inspect the generated
`route-map.d.ts`, then inspect `git diff --check` and `git status --short`.
Confirm the only intentional generated-file change is the route-map update and
that no pre-existing dirty file was reverted.

Finally refresh the code graph after source edits:

```sh
graphify update .
```

**Verify**: all six validation commands plus `git diff --check` exit 0; graphify update completes without error.

## Test plan

- Framework unit tests prove resource create, resource update, and raw
  `formProps` composition. Model structure after DetailView's existing
  resource/raw tests in `components/views/__tests__/views.spec.ts`.
- Compile-time tests prove `FormView :form` cannot type-check and required
  update identities remain required.
- Web tests prove resource actions name create routes and query-state create no
  longer reaches a create screen.
- Web type-check/build prove mechanical route names and generated types follow
  renamed filesystem files.

## Done criteria

- [ ] Both create screens are `create.route.vue`; no application create URL or generated route name contains `new`.
- [ ] `FormView` supports exactly resource-first (`resource`, optional `id`) and raw (`formProps`) input branches.
- [ ] `FormView :form` has no implementation path and fails compile-time coverage.
- [ ] No `/new` alias, redirect, deprecation warning, or prop normalization exists.
- [ ] DetailView raw composition remains unchanged.
- [ ] All six validation commands, `git diff --check`, and `graphify update .` succeed.
- [ ] `plans/README.md` row is updated after implementation/review.

## STOP conditions

- The existing dirty changes modify any current-state excerpt or already rename
  either route file; reconcile them with the plan before editing.
- Vue SFC prop inference cannot express the create-only/update-only guarantees
  without weakening the identity check. Stop rather than using `any`, an
  untyped cast, or a runtime mode switch.
- Regenerating the route map creates names other than the mechanical
  `*-create` names, or requires a manual route-name override.
- Supporting a caller requires `/new`, `form`, a redirect, a warning, or a
  prop-normalization branch.
- Any validation command fails twice after a scoped correction.

## Maintenance notes

`create` is the sole static spelling for a resource creation screen. Future
resources add `<resource>/create.route.vue` and target its mechanically derived
`*-create` action name. Normal routes should use FormView resource mode;
`formProps` is reserved for genuinely composed forms whose custom input/load or
submit behavior cannot be represented by resource factory arguments. Reviewers
should reject a reintroduced `form` prop or `/new` route even if framed as a
temporary migration aid.
