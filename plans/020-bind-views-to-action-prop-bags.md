# Plan 020: Bind standard Views to action prop bags

> **Implementation instructions**: Change the three View shells as one user-facing contract. Keep raw `table`, `detail`, and `formProps` modes for custom composition.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- packages/is-vue-framework/src/components/views packages/is-vue-framework/src/resources`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/019-replace-resource-with-per-action-api.md`
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

The approved public syntax is `v-bind="resource.list()"`, not `:resource="resource"`. Views must receive native prop bags and map action `run` to the existing core loader or submitter. This keeps the View honest: it renders a supplied action and does not inspect a resource model.

## Current state

- `ListView.vue:49-97` accepts a resource and calls `resource.table()`.
- `DetailView.vue:17-36` accepts a resource and calls `resource.detail()`.
- `FormView.vue:33-120` inspects resource capabilities, identity, and form overloads.

Target route syntax:

```vue
<ListView v-bind="users.list()" />
<DetailView v-bind="users.detail({ id })" />
<FormView v-bind="users.create()" />
<FormView v-bind="users.update({ id })" />
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| View tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/views` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/DetailView.vue`
- `packages/is-vue-framework/src/components/views/FormView.vue`
- `packages/is-vue-framework/src/components/views/FormView.types.ts`
- Existing focused View tests under `packages/is-vue-framework/src/components/views/__tests__/`

**Out of scope**:

- Core `Table`, `Detail`, and `Form` contracts
- Application routes
- Resource runtime behavior
- Removal of raw prop modes

## Git workflow

- Branch: `codex/020-view-action-bindings`
- Commit: `refactor(framework): bind views to resource actions`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Change ListView

Accept the list action prop bag directly. Map its `run` to `Table.load`. Keep title, filters, export, query binding, routes, and delete controls. Remove resource inspection from the new action mode.

**Verify**: focused tests cover load, create/detail/update routes, delete, access-hidden controls, and raw `table` mode.

### Step 2: Change DetailView

Accept the detail action prop bag directly. Map `run` to `Detail.load`. Keep title, back target, controls, slots, and raw `detail` mode.

**Verify**: focused tests cover load arguments, field forwarding, slots, and raw mode.

### Step 3: Change FormView

Accept create or update action prop bags directly. Map `run` to `Form.submit`; update action bags also supply the detail loader. Keep after-submit navigation, toast behavior, dirty-leave guard, and raw `formProps` mode. Remove resource capability inspection from the new action mode.

**Verify**: focused tests cover create, update, default route, `afterSubmit`, failed navigation, and raw mode.

### Step 4: Prove exact public binding

Add compile-time fixtures for the four target bindings. Reject list/detail/create/update cross-binding errors.

**Verify**: run all commands in the table.

## Test plan

- Extend the existing View tests for action-prop binding and raw core-prop binding.
- Test list routes and delete controls, detail loading and slots, and create/update submission plus navigation.
- Add type fixtures that accept the four approved bindings and reject cross-binding errors.
- Verification: focused View tests, full framework tests, and both type checks exit 0.

## Done criteria

- [ ] All three Views accept standard action prop bags.
- [ ] Views map `run` to core `load` or `submit` without another adapter component.
- [ ] Raw core-prop modes still work.
- [ ] No View needs the full resource object in the new path.
- [ ] Framework and web type checks pass.

## STOP conditions

- Stop if a View must call `defineResource` or know the schema.
- Stop if route-owned dialogs or confirmation logic moves into a View.
- Stop if a core component must gain resource knowledge.

## Maintenance notes

Future View options must remain native props in the standard action block. Do not restore a resource interpreter prop.
