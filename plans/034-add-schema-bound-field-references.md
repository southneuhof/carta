# Plan 034: Add schema-bound field references

> **Implementation instructions**: Implement only the API in the locked decisions below. Keep the existing action-field map as a private migration input until plan 036. Do not document it as supported. Plans 034-036 must ship together.
>
> **Drift check**: `git diff --stat ab4c5ca..HEAD -- packages/is-vue-framework/src/contracts packages/is-vue-framework/src/fields packages/is-vue-framework/src/resources`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: plans 018-033
- **Category**: architecture
- **Planned at**: commit `ab4c5ca`, 2026-08-12

## Why this matters

The per-action resource API repeats the same field labels, accessors, renderers,
and renderer props in list, detail, create, and update blocks. Plain constants
reduce some repetition, but they make each field a separate local abstraction
and still do not give the framework schema-aware field identity. The framework
needs one adjacent field definition and ordered field references at each action.

This plan supersedes the complete flat per-action field-map decision in plans
019, 023-033. It does not change action ownership, schema ownership, View prop
bags, or the custom-action contract.

## Locked decisions

1. `defineSchema` continues to own the standard record, query, create, and
   update types and validation.
2. Fields are a separate but adjacent concept. Define them with the direct
   helper `defineFields(schema, definitions)`. Do not use a curried call.
3. `defineFields` returns immutable field references with a field key and schema
   identity. It does not return a raw field map.
4. A resource action receives an ordered array of references. Array order is
   the final View order, and omission removes a field from that View:

   ```ts
   fields: [usersFields.name, usersFields.email]
   ```

5. A field definition uses the existing complete vocabulary: shared `label`,
   `read`, and `write`, plus `display`, `table`, `detail`, and `form`
   projections. The resource selects the projection only after it applies an
   override.
6. Each base field reference has one terminal, immutable
   `.override(partialDefinition)` operation. The override uses the same nested
   vocabulary as the base definition. It is not action-aware, and its result
   has no `.override` method.
7. The override is a partial patch. These are valid:

   ```ts
   usersFields.password.override({ label: 'New password' })
   usersFields.status.override({ display: { format: 'text' } })
   usersFields.password.override({
     form: { renderer: 'password', props: { required: false } },
   })
   ```

8. Merge rules are fixed:
   - top-level scalar values and functions replace;
   - `display`, `table`, `detail`, and `form` merge by property;
   - `props` and `behavior` shallow-merge;
   - `source` replaces as one value;
   - arrays and functions replace;
   - nested renderer-owned values inside `props` do not deep-merge.
9. `undefined` inherits. This version adds no delete or clear syntax.
10. An irrelevant projection is accepted and has no effect. For example, a
    `display` override in a create action is valid but unused.
11. Do not add `.forList`, `.forDetail`, `.forCreate`, `.forUpdate`,
    surface-qualified override methods, context-sensitive override typing, or
    fluent methods for individual properties.
12. `Table`, `Detail`, and `Form` keep their current raw `FieldsInput` support
    for custom screens. Only the standard resource-action seam requires field
    references after plan 036.

## Rejected alternatives

- Complete action-local field maps: rejected because they caused the repeated
  behavior that this change removes.
- One plain constant per field: rejected because it repeats the schema binding
  work without giving the framework field identity.
- `.forList`, `.forDetail`, `.forCreate`, or `.forUpdate`: rejected because
  field definitions use display and form language, not resource action names.
- A flat, context-sensitive override: rejected because display and form
  renderers can both have `renderer`, `props`, and related values. Hidden action
  context would make the same expression mean different things.
- A generic fluent chain or deep merge: rejected because one partial object
  override covers the current need with fewer rules.

## Target API

```ts
const accountFields = defineFields(accountSchema, {
  name: {
    label: 'Name',
    form: { renderer: 'text' },
  },
  password: {
    label: 'Password',
    form: { renderer: 'text', props: { type: 'password', required: true } },
  },
})

const accounts = defineResource(accountSchema, {
  key: 'accounts',
  actions: {
    list: { run: listAccounts, fields: [accountFields.name] },
    create: {
      run: createAccount,
      fields: [accountFields.name, accountFields.password],
    },
    update: {
      run: updateAccount,
      fields: [
        accountFields.name,
        accountFields.password.override({
          label: 'New password',
          form: { renderer: 'password', props: { required: false } },
        }),
      ],
    },
  },
})
```

## Current state

- `packages/is-vue-framework/src/contracts/fields.ts:117-151` already defines
  the complete shared and surface field vocabulary and raw core-component
  inputs.
- `packages/is-vue-framework/src/fields/resolve.ts:110-142` already projects a
  field definition and shallow-merges renderer props. Reuse this resolver.
- `packages/is-vue-framework/src/resources/actionResource.ts:51-79` duplicates
  a flat resource-only field contract.
- `packages/is-vue-framework/src/resources/actionResource.ts:323-359` converts
  the flat action field back into the complete field vocabulary.
- `packages/is-vue-framework/src/resources/actionResource.ts:406-504` resolves
  action fields separately for list, detail, create, and update.
- `packages/is-vue-framework/src/fields/index.ts:1-14` has no `defineFields`
  export in the current tree.

Current resource input:

```ts
fields: {
  roleCode: { label: 'Role Code', renderer: 'text' },
}
```

Target resource input:

```ts
fields: [rolesFields.roleCode]
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/fields/__tests__/defineFields.spec.ts src/fields/__tests__/resolve.spec.ts src/resources/__tests__/resources.spec.ts` | exit 0 |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Public API | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/__tests__/public-api.spec.ts` | exit 0 |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/fields.ts`
- `packages/is-vue-framework/src/fields/defineFields.ts` (create)
- `packages/is-vue-framework/src/fields/index.ts`
- `packages/is-vue-framework/src/fields/resolve.ts` only where existing
  projection and merge code must accept resolved references
- `packages/is-vue-framework/src/fields/__tests__/defineFields.spec.ts` (create)
- `packages/is-vue-framework/src/contracts/__type-tests__/fields.type-test.ts`
- `packages/is-vue-framework/src/resources/actionResource.ts`
- resource runtime and type tests
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`

**Out of scope**:

- Application resource migration
- Documentation changes
- Action names, `run`, permissions, routes, invalidation, and View bindings
- Changes to raw field input for core components
- A general deep-merge utility
- More than one override operation

## Git workflow

- Branch: `codex/034-schema-bound-fields`
- Commit: `feat(framework): add schema-bound fields`
- Do not merge plan 034 without plans 035 and 036.
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Add the field-reference contracts

Add a schema-branded `FieldReference` for a base field and a terminal
`FieldOverride` result. Keep the brand implementation-private. The public
reference must expose only the data needed for authoring and the base
`.override()` method; the variant must not expose `.override()`.

Type known keys from the union of schema record, create, and update keys. `read`
sees the record type. `write` and form behavior see the union of only the create
and update draft types that contain that field key. Permit a display-only
computed key outside the schema-key union only when it declares `read`. Such a
computed field can be used by list and detail, but not create or update. Action
arrays must reject a schema field that is not present in that action's schema
part.

**Verify**: compile-time fixtures cover a record field, create-only field,
update-only field, computed read field, unknown typo, wrong action,
incompatible schema shape, and a second override call. Runtime coverage rejects
a same-shaped reference created from a different schema value.

### Step 2: Implement `defineFields`

Implement `defineFields(schema, definitions)` with no extra builder layer.
Return one frozen reference per definition. A base reference stores its key,
schema identity, and complete definition. `.override()` returns a new frozen
terminal reference and does not mutate the base or patch object.

Implement the locked merge rules in this file or one small adjacent helper.
Do not use the general surface-layer merge as a generic object deep merge.

**Verify**: focused tests prove base immutability, terminal override shape,
partial label and projection changes, shallow `props` and `behavior` merges,
atomic `source`, and replacement of nested objects, arrays, and functions.

### Step 3: Resolve references through the existing field pipeline

Make the resource resolver validate that all references belong to the resource
schema and that an action array has no duplicate key. Throw a precise framework
error for either case. Apply an override to the complete definition first, then
use the existing table, detail, or form projection and normal field defaults.

Do not add an action-aware override implementation. Do not duplicate the
surface resolver.

**Verify**: resource tests cover array order, omission, each surface, one
override, foreign schema rejection, and duplicate rejection.

### Step 4: Keep migration coexistence private and short

Temporarily accept the current flat field map so plan 035 can migrate one module
at a time. Keep its types and converter internal to `actionResource.ts`; do not
export a new compatibility name or add it to documentation. Plan 036 deletes
this path.

**Verify**: the current app type-check can still run while the new framework
tests use only references.

### Step 5: Export the new helper and types

Export `defineFields` and only the author-facing reference types needed for
inference or explicit annotations. Do not export internal brands, merge
helpers, or the temporary map input.

**Verify**: the public API test asserts the helper is present and internal
implementation names are absent.

## Test plan

- Use compile-time fixtures for schema key and action compatibility.
- Use one focused runtime spec for immutability and exact merge rules.
- Extend the resource spec for ordered projection and invalid input errors.
- Keep core field resolver tests unchanged except where a shared input type must
  widen. Do not duplicate its full precedence suite.
- Run all commands in the command table.

## Done criteria

- [x] `defineFields(schema, definitions)` returns typed immutable references.
- [x] Base references have one terminal `.override(partialDefinition)`.
- [x] All locked merge rules have focused coverage.
- [x] Resource arrays preserve order and omission.
- [x] Wrong-schema and duplicate references fail clearly.
- [x] Core components still accept raw fields.
- [x] Temporary map support is private and explicitly assigned to plan 036.
- [x] All framework checks pass.

## STOP conditions

- Stop if action compatibility cannot be derived from the existing schema parts
  without explicit action names in the field API.
- Stop if a current resource needs a computed write field outside its create or
  update schema; report that field before adding an escape hatch.
- Stop if field clearing is required by a current caller; define its semantics
  before accepting `null` or another sentinel.
- Stop if the implementation needs a second public helper or a general deep
  merge utility.
- Stop if raw core-component fields would need to become references.

## Maintenance notes

Keep field definitions next to their resource. Use the same resource file by
default. Split a `*.fields.ts` file only when the field definition is large
enough to improve local readability; the framework does not require that file.
