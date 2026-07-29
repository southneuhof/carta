# Plan 035: Remove retired MasterLookupInput and DynamicFormInput surfaces

> **Implementation instructions:** Follow each step and verification gate. This
> is a hard removal for framework 2.0; do not add aliases, warnings, or
> compatibility shims. Update this plan's row in `plans/README.md` only after
> implementation and review.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/components/composites/form-inputs packages/is-vue-framework/src/components/composites/formInputRegistry.ts packages/is-vue-framework/src/renderers/form.ts packages/is-vue-framework/src/model-config/types.ts packages/is-vue-framework/src/runtime.ts apps/web/src/framework/adapters apps/web/src/routes/\(public\)/input-catalog`
> If live references differ from “Current state,” stop and reconcile before
> deleting anything.

## Status

- **Priority:** P1
- **Effort:** S
- **Risk:** LOW
- **Depends on:** none
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

`MasterLookupInput` and `DynamicFormInput` are unused framework opinions that
keep dead runtime capabilities, renderer keys, and catalog fixtures alive. Hard
removal shrinks migration scope and prevents new callers from selecting APIs the
framework no longer intends to support.

## Current state

- `packages/is-vue-framework/src/renderers/form.ts:101-111` registers
  `lookup`, `master-lookup`, `dynamic-form`, and `file-manager` as built-ins.
- `packages/is-vue-framework/src/components/composites/formInputRegistry.ts:23-36`
  repeats the legacy registry entries for `master-lookup` and `dynamic-form`.
- `packages/is-vue-framework/src/model-config/types.ts:37,42` includes both in
  `KnownFieldType`.
- `packages/is-vue-framework/src/runtime.ts:14,28` defines and exposes
  `FrameworkDynamicFormRuntime`.
- `apps/web/src/framework/adapters/index.ts:11,23` injects the web
  `dynamicForm` adapter into `FrameworkRuntime`.
- `apps/web/src/routes/(public)/input-catalog/inputCatalogDemo.ts:3-55`
  catalogs both inputs, adds fixtures/labels, and gives `dynamic-form` full span.

Short current excerpts:

```ts
// packages/is-vue-framework/src/renderers/form.ts:101-108
lookup: legacyInput(() => import('../components/composites/form-inputs/LookupInput.vue')),
'master-lookup': legacyInput(() => import('../components/composites/form-inputs/MasterLookupInput.vue')),
// ...
'dynamic-form': legacyInput(() => import('../components/composites/form-inputs/DynamicFormInput.vue')),
```

```ts
// packages/is-vue-framework/src/runtime.ts:14,28
export interface FrameworkDynamicFormRuntime { getTemplate?: (templateAPI: string) => Promise<any[]> }
// ...
dynamicForm?: FrameworkDynamicFormRuntime
```

Registry tests under
`packages/is-vue-framework/src/components/composites/__tests__/formInputRegistry.spec.ts`
and `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts` are
canonical patterns for locking renderer membership.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Reference audit | `rg -n "MasterLookupInput|DynamicFormInput|master-lookup|dynamic-form|FrameworkDynamicFormRuntime|dynamicForm" packages/is-vue-framework apps/web` | no matches |

## Scope

**In scope**

- Delete
  `packages/is-vue-framework/src/components/composites/form-inputs/MasterLookupInput.vue`.
- Delete
  `packages/is-vue-framework/src/components/composites/form-inputs/DynamicFormInput.vue`.
- `packages/is-vue-framework/src/components/composites/formInputRegistry.ts`
- `packages/is-vue-framework/src/components/composites/__tests__/formInputRegistry.spec.ts`
- `packages/is-vue-framework/src/renderers/form.ts`
- `packages/is-vue-framework/src/renderers/__tests__/registry.spec.ts`
- `packages/is-vue-framework/src/model-config/types.ts`
- `packages/is-vue-framework/src/runtime.ts`
- `apps/web/src/framework/adapters/index.ts`
- Delete `apps/web/src/framework/adapters/dynamicForm.ts` if it exists and has
  no non-runtime callers.
- `apps/web/src/routes/(public)/input-catalog/inputCatalogDemo.ts`
- `apps/web/src/routes/(public)/input-catalog/index.route.spec.ts`
- Documentation that explicitly lists either removed renderer.

**Out of scope**

- `LookupInput`, ordinary `Form`, or renderer-registry redesign.
- File Manager removal; it becomes optional in plan 039.
- Legacy table/detail endpoint APIs.
- Any model-value behavior change.

## Git workflow

- Branch: `codex/035-remove-retired-form-inputs`
- Use one conventional commit:
  `refactor(framework): remove retired form inputs`.
- Do not push or open a PR without operator instruction.

## Steps

### Step 1: Lock removal expectations in tests

Update registry and public-surface tests so they assert that neither retired key
is built in and neither retired component/runtime type is referenced by source.
Keep assertions structural; do not import deleted files to prove absence.

**Verify:**  
`pnpm --filter @southneuhof/is-vue-framework test -- src/components/composites/__tests__/formInputRegistry.spec.ts src/renderers/__tests__/registry.spec.ts src/__tests__/public-api.spec.ts`
→ tests pass after removal.

### Step 2: Remove package implementation and type surfaces

Delete both component files. Remove their async imports from both registries,
their `KnownFieldType` union members, and
`FrameworkDynamicFormRuntime`/`FrameworkRuntime.dynamicForm`.

Do not leave commented imports, fallback renderers, or string aliases.

**Verify:**  
`rg -n "MasterLookupInput|DynamicFormInput|master-lookup|dynamic-form|FrameworkDynamicFormRuntime|dynamicForm" packages/is-vue-framework/src`
→ no matches.

### Step 3: Remove web adapter and catalog entries

Remove `dynamicForm` import/capability injection. Delete adapter module only
after `rg` proves no other caller. Remove both keys, fixtures, labels, initial
values, and span rules from input catalog. Update catalog completeness tests to
the smaller built-in set.

**Verify:**  
`rg -n "MasterLookupInput|DynamicFormInput|master-lookup|dynamic-form|FrameworkDynamicFormRuntime|dynamicForm" apps/web/src`
→ no matches.

### Step 4: Run package and app gates

Run framework tests/typecheck, then web tests/typecheck. Inspect `git diff
--name-only` and ensure every changed file appears in Scope.

**Verify:** all four commands in “Commands you will need” exit 0.

## Test plan

- Registry membership: removed keys absent; nearby `lookup` remains present.
- Public API/source boundary: removed runtime capability absent.
- Input catalog: key list and generated field catalog remain one-to-one.
- No browser test needed; feature is deleted and no replacement UI is introduced.

## Done criteria

- [ ] Both `.vue` files deleted.
- [ ] No package/web references remain.
- [ ] `lookup` and other live renderers remain registered.
- [ ] Framework and web tests/typechecks pass.
- [ ] No compatibility shim exists.
- [ ] Only in-scope files changed.
- [ ] Plan row marked DONE after review.

## STOP conditions

- Any production resource outside input catalog still uses either renderer key.
- A removed adapter has a non-dynamic-form caller.
- Removal requires changing general `Form` semantics.
- In-scope source drift makes reference list materially different.

## Maintenance notes

Reviewer should reject aliases that silently keep either renderer alive. Future
specialized lookups should compose explicit loader/field contracts, not revive
`MasterLookupInput`. Future server-driven forms need a separate design proposal,
not restoration of `DynamicFormInput`.

