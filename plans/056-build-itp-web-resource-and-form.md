# Plan 056: Build the ITP resource and editor

> **Implementation instructions**: Start only after plan 055 is DONE. Use the
> API contract exactly as written. Keep the inspector grid route-local and
> change no framework source. Update this plan row in `plans/README.md` after
> implementation and review.
>
> **Drift check (run first)**: `git diff --stat b0bf0c2..HEAD -- apps/web/src apps/api/src/routes/inspection-test-plans packages/is-vue-framework`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/055-build-itp-api-contract.md`
- **Category**: migration
- **Planned at**: commit `b0bf0c2`, 2026-08-18

## Why this matters

The ITP form is the only place where a user creates or changes inspection
criteria and responsibility points. The legacy flow supports an editable grid
on create and update; the first slice keeps that behavior but uses the current
schema-bound resource and upload infrastructure.

## Current state

- `apps/web/src/routes/(authenticated)/quality/pts/pts.schema.ts`,
  `pts.actions.ts`, and `pts.resource.ts` are the nearest app-owned Hono and
  resource pattern.
- `packages/is-vue-framework/src/components/core/Form.vue:250-278` exposes an
  `input:<field>` slot with `value`, `set-value`, error, and disabled state.
  Use that slot for the approved domain-only inspector grid.
- `apps/web/src/framework/inputs/registry.ts` owns the image upload adapter.
  Use the normal `image` field; do not create an upload control.
- `docs/architecture/web-application-architecture.md` locks route, schema,
  resource, and framework ownership. The ITP design permits only one custom UI
  layer: the tree and inspector-grid domain rendering.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Web tests | `pnpm --filter @southneuhof/framework-web test -- inspection-test-plans` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Use `build-resource-form` for the schema-to-resource and API contract.
- Use `web-ui-surface-reuse` for the form, dialog, table, and tree surfaces.
- Read `docs/architecture/web-application-architecture.md`,
  `packages/is-vue-framework/README.md`, the current PTS resource, and the
  current input registry before editing.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/itp.schema.ts`
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/itp.actions.ts`
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/itp.resource.ts`
- `apps/web/src/routes/(authenticated)/quality/inspection-test-plans/ItpInspectorGrid.vue`
- focused resource/action/component tests in the same directory

**Out of scope**:

- The project list, tree route, navigation entry, and page-level dialogs (plan
  057).
- Framework renderer registration or framework source changes.
- Inspector Type and Inspection Point CRUD, import/export, QI, or legacy data.

## Steps

### Step 1: Define the typed schema, actions, and resource

Bind the select, create, and update Zod schemas from plan 055 with
`defineSchema` and `fromZod`. Use one `defineFields` catalog. Define these
create/update fields in this exact order: `type`, `criteria`, `procedureCode`,
`specification`, `method`, `frequency`, `inspectors`, `imgDocumentation`, and
`description`.

Use radio options `material/Material`, `process/Process`, and
`product/Product`. Mark `frequency` as a required numeric input. Use standard
text/textarea/image renderers for the normal fields. Do not add the legacy
`material` or `product` data fields.

Use app-local RPC functions for template, tree, standard create/update/detail,
and delete. A `defineResource` action wraps only standard CRUD behavior; custom
tree/template loads remain ordinary typed functions.

**Verify**: focused resource tests assert field order, renderer keys, radio
values, retained image write mapping, and no legacy fields.

### Step 2: Implement the route-local inspector-grid input

Create `ItpInspectorGrid.vue` as a domain component, not a framework input.
It receives the complete `inspectors` grid, renders each active inspector type
with each active inspection point, and emits a full new grid when a checkbox
changes. It must accept a disabled state for detail display. Use existing
framework base `Card`, `Checkbox`, and `Button` surfaces; no native replacement
inputs and no generic nested-grid abstraction.

On create, plan 057 loads the template before opening the dialog and passes it
as initial data. On update, use the saved grid from ITP detail. A zero-selected
grid is valid. The client must not hide a point or mutate master-data identity.

**Verify**: component tests cover complete initial rendering, a toggle update,
all-false validity, and disabled presentation.

### Step 3: Provide form slots for create, update, and read-only detail

Export reusable form props/slots for the page route: the `inspectors` form slot
uses `ItpInspectorGrid` and the field slot contract from `Form.vue`; the detail
value slot uses the same component with `disabled`. Use `DialogForm` or `Form`
only at the route level in plan 057. Keep submission and refresh out of this
resource module.

**Verify**: action tests prove create/update payloads keep the full inspector
grid and update uses the selected record identity.

## Test plan

Add only tests for resource field order and payload mapping, inspector grid
toggle/disabled behavior, and all-false point validity. Follow
`pts.resource.spec.ts` and `pts.actions.spec.ts`; do not snapshot complete
forms or test framework form internals.

## Done criteria

- [ ] One schema-bound ITP resource and app-owned Hono action module exist.
- [ ] The form has the approved nine fields, order, values, and required rules.
- [ ] The grid uses the full API template and stays editable in updates.
- [ ] The normal image renderer and existing upload adapter are reused.
- [ ] No framework code, generic input, master-data CRUD, or deferred feature is added.
- [ ] Focused tests, type checks, lint, and diff check pass.

## STOP conditions

- The API contract from plan 055 differs from the full-grid payload above.
- A slot cannot receive the form value/setter or the existing framework
  checkbox surface cannot express the grid interaction.
- The work requires registering a new global renderer or changing the framework.

## Maintenance notes

Import/export can reuse the ITP type options and point codes from this module,
but must not replace the server's master-data validation.
