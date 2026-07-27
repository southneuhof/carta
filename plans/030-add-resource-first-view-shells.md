# Plan 030: Add resource-first ListView and DetailView shells

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before continuing. If a STOP condition occurs, stop and report. Review
> every diff hunk against this plan before marking it done.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat e4f345c..HEAD -- packages/is-vue-framework/src apps/web/src
> ```
> Plans 026–029 are expected. Confirm the Current state excerpts still match semantically; any other
> change to `ListView.vue`, `DetailView.vue`, resource surface factories, or CRUD route call sites is
> a STOP until reconciled.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (public component props and standard destructive-action lifecycle)
- **Depends on**: `plans/029-use-vue-router-resource-targets.md`
- **Category**: tech-debt / DX
- **Planned at**: commit `e4f345c`, 2026-07-27; after plan 029

## Why this matters

Ordinary routes should declare resource, identity, and page presentation; they should not manually
project a resource into core props or reimplement standard deletion. Today
`roles.detail({ id, onDelete })` needs a route-owned handler even though the resource already owns
delete capability, permission, transport, invalidation, and list navigation.

`ListView` and `DetailView` should gain resource-first modes:

```vue
<ListView title="Roles" :resource="roles" />
<DetailView title="Detail Role" :resource="roles" :id="$route.params.roleId" />
```

The existing raw `table`/`detail` modes remain escape hatches for custom compositions. Internally,
resource-first mode still calls `resource.table()` / `resource.detail({ id })`; these factories remain
public and tested, but disappear from ordinary route boilerplate.

## Current state

- `ListView.vue:15-20` requires `{ table, controls? }`; it never sees a resource.
- `DetailView.vue:14-19` requires `{ detail, controls? }`; it never sees a resource or identity.
- `defineResource.ts:127-145` exposes shell bundles and accepts an optional `onDelete`.
- `roles/[roleId]/detail.route.vue:15-27` manually calls `roles.remove`, shows success/error toasts,
  navigates to `roles.routes.list`, and passes the handler into `roles.detail`.
- `resources/defineResource.ts:352-356` already centralizes delete plus semantic invalidation.
- `projectAdapters.ts:97-101` already normalizes errors through
  `useResourceRuntime().adapters.data.normalizeError`.
- `ViewControl` already carries `loading`; `ViewControls` disables loading buttons.
- The package already depends on `vue-router` and `vue-sonner`.
- Exceptional overtime detail preloads its record and adds workflow controls; it should remain raw
  detail mode in this plan.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Manual handler sweep | `rg -n "onDelete|async function remove|\\.remove\\(" apps/web/src/routes packages/is-vue-framework/src` | only explicit escape-hatch/test uses |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/views/{ListView.vue,DetailView.vue,ViewControls.vue}`
- View component contracts/helpers needed to express mutually exclusive modes
- `packages/is-vue-framework/src/resources/{defineResource.ts,controls.ts}`
- Existing framework view/resource/type tests
- Ordinary users/roles list and detail route files
- Overtime list route; overtime detail only where compiler/API migration requires raw-mode spelling
- Web resource adapter specs covering standard controls
- Relevant sections of scoped architecture/migration docs

**Out of scope**:

- Route paths, layouts, tabs, guards, or `identityFromRoute` — plan 031
- FormView resource-first mode; create/update submission feedback remains route-owned
- Overtime workflow orchestration or preloading redesign
- Row-level delete controls
- New confirmation dialog UX; preserve current no-confirmation behavior
- Backend/API mutation behavior

## Git workflow

- Stay on current branch; do not push or open a PR.
- Do not combine route-tree work from plan 031.
- If commits are requested later, use conventional commit style.

## Steps

### Step 1: Define mutually exclusive resource-first and raw prop modes

Create exported view prop types or local generic helpers that express:

```ts
type ListViewInput =
  | { resource: Resource; table?: never; controls?: never; tableOptions?: TableSurfaceArguments }
  | { table: TableProps; controls?: readonly ViewControl[]; resource?: never; tableOptions?: never }

type DetailViewInput =
  | {
      resource: Resource
      id: RecordIdentity
      detail?: never
      controls?: never
      detailOptions?: Omit<DetailSurfaceArguments, 'id' | 'onDelete'>
    }
  | {
      detail: DetailProps
      controls?: readonly ViewControl[]
      resource?: never
      id?: never
      detailOptions?: never
    }
```

Exact Vue-compatible typing may use overload helper types rather than these literal unions, but
invalid mixed modes must fail contract type tests. Preserve current slots and chrome.

`id` stays a separate prop. DetailView must never inspect route params or infer identity.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected: exit 0; type tests prove valid resource/raw modes and reject mixed modes or resource mode
without `id`.

### Step 2: Resolve resource projections inside the views

In resource-first ListView mode, compute `resource.table(tableOptions)` and use its `{ table,
controls }`. In raw mode, preserve current behavior exactly.

In resource-first DetailView mode, compute `resource.detail({ id, ...detailOptions })`. Keep factory
calls reactive when `id` changes. In raw mode, preserve existing `detail` and `controls`.

Do not mutate caller-owned option objects. Do not cache component-bound handlers in resource memo
keys; current resource factories intentionally rebuild control arrays while memoizing core props.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
```

Expected: existing raw-mode tests pass plus new resource-mode list/detail rendering tests.

### Step 3: Derive standard deletion in resource-first DetailView

When all are true:

- resource has delete capability;
- access allows delete;
- resource-first mode is active;

pass an internal `onDelete` to `resource.detail`. Its lifecycle:

1. Ignore repeated selection while pending.
2. Mark delete control loading/disabled.
3. `await resource.remove(id)`; this performs transport plus invalidation.
4. On success, show `toast.success('Data berhasil dihapus.')`.
5. `await router.replace(resource.routes.list)` when a list target exists.
6. On failure, normalize through the installed data adapter and show its message, falling back to
   `'Gagal menghapus data.'`.
7. Clear pending state if component remains mounted.

No confirmation is added: current roles deletion has none, and destructive UX expansion is outside
scope. Raw detail mode never invents deletion; its supplied controls remain authoritative.

Use `router.replace`, not `push`, so browser Back does not return to a deleted record.

Add an explicit override in `detailOptions.controls.overrides.delete = false` for screens that must
hide standard delete. Any exceptional delete workflow uses raw mode or a supplied raw control; do not
add `onDelete` back to ordinary route APIs.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
```

Expected new tests:

- successful delete calls `remove(id)` once, shows success, and replaces with list target;
- double click while pending calls once;
- failure stays on page and shows normalized error;
- missing capability/access/list target follows documented absence/navigation behavior;
- raw mode does not derive delete.

### Step 4: Migrate ordinary web routes

Migrate list routes:

```vue
<ListView title="Roles" :resource="roles">
  ...
</ListView>
```

Migrate ordinary users/roles details:

```vue
<DetailView title="Detail Role" :resource="roles" :id="roleId" />
```

Delete the roles route's manual `remove`, toast, router import if unused, and `onDelete`. Keep route
param extraction unchanged until plan 031. Keep overtime detail in raw mode because it injects loaded
data and record-state workflow controls.

Use `tableOptions` only where an ordinary list needs namespace/search parameters; do not force custom
collections into resource-first mode when raw `table` is clearer.

**Verify**:

```sh
rg -n "onDelete|async function remove|roles\\.remove" apps/web/src/routes
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
```

Expected: sweep has no ordinary roles detail handler; type-check exits 0; all tests pass.

### Step 5: Document ordinary and escape-hatch modes

Update architecture and migration examples:

```vue
<ListView :resource="incidents" />
<DetailView :resource="incidents" :id="incidentId" />
```

Document:

- view calls the existing surface factory internally;
- raw `:table`/`:detail` modes remain for composed/custom screens;
- resource-first DetailView owns standard delete lifecycle;
- `id` is explicit and may be scalar or composite;
- views do not infer current route identity.

Do not document plan 031's URL/tree changes yet.

**Verify**:

```sh
rg -n 'ListView.*resource|DetailView.*resource|raw mode' docs/architecture
```

Expected: ordinary and escape-hatch examples both exist.

## Test plan

- Contract type tests for mutually exclusive props and typed composite `id`.
- ListView resource mode: table load, create control, slots.
- DetailView resource mode: load/update/list controls, identity changes.
- Derived delete: success, failure, pending double-click, capability/access absence, no list target.
- Raw mode regression: overtime-style supplied data/custom controls unchanged.
- Web route/spec migration and full suites.

## Done criteria

- [ ] Ordinary list route shape is `<ListView :resource="resource">`.
- [ ] Ordinary detail route shape is `<DetailView :resource="resource" :id="id">`.
- [ ] `resource.table()` and `resource.detail()` remain public raw composition APIs.
- [ ] Roles detail contains no manual delete handler, toast, or navigation.
- [ ] Standard delete calls resource remove, invalidates, reports outcome, and replaces to list.
- [ ] Raw view modes preserve current behavior and slots.
- [ ] Framework/web tests and type-checks pass.
- [ ] Documentation covers both modes.
- [ ] `plans/README.md` updated only after review.

## STOP conditions

- Vue SFC prop typing cannot make mixed resource/raw modes a compile error without exposing a large
  generic parameter list to normal callers. Report the smallest failed design before weakening types.
- Calling `resource.detail()` inside a computed causes core detail reload/reset on unrelated reactive
  changes. Preserve memoized core props; STOP if this requires disabling resource memoization.
- Generic delete feedback requires adding app-specific resource names/messages to resource
  definitions. Use generic messages; do not expand resource vocabulary.
- Router navigation after delete cannot be tested without global singleton state. Use a memory router;
  STOP rather than introduce a singleton.

## Maintenance notes

- FormView intentionally remains projection-first because create/update success destinations vary by
  workflow. Revisit only after repeated route boilerplate appears.
- Confirmation remains a separate product decision. Add it later at the single DetailView lifecycle,
  not per route.
- If custom screens need standard deletion plus custom detail props, prefer `detailOptions` before
  exposing callback plumbing again.
