# Plan 039: Migrate special app Zod schemas

> **Implementation instructions**: Run plan 037 first. Run this plan after or
> alongside plan 038 only when the framework foundation is complete. Preserve
> the local form and update preprocessing behavior. Do not introduce a raw
> resource generic or a compatibility overload.
>
> **Drift check (run first)**: `git diff --stat ab4c5ca..HEAD -- 'apps/web/src/routes/(authenticated)/settings/users/users.schema.ts' 'apps/web/src/routes/(authenticated)/settings/roles/roles.schema.ts'`
>
> These files are uncommitted files from the earlier resource migration. Compare
> them with the current files; do not delete or reset them.

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/037-schema-first-zod-type-inference.md and plan 038's edit gate
- **Category**: migration
- **Planned at**: commit `ab4c5ca`, 2026-08-12

## Why this matters

Two app schemas do more than bind a direct entity schema. The users form accepts
selected role records and parses them into role IDs. The roles update schema
removes the immutable `realm` field before parsing. These cases need focused
verification because their raw input and parsed output are not the same thing.

The schema-only bridge is still the correct API. The special behavior belongs in
the local schema, not in a caller-supplied `fromZod` type.

## Current state

The users schema currently uses a raw input alias to type parsed output:

```ts
// apps/web/src/routes/(authenticated)/settings/users/users.schema.ts:8-27
export type CreateUserInput = z.input<typeof createUserSchema>

export const createUserValidation = createUserSchema.extend({
  systemRoleIds: z.array(systemRoleSelection).min(1).superRefine(/* unique IDs */),
})

create: { schema: fromZod<CreateUserInput>(createUserValidation) }
```

`CheckboxGroupInput` emits selected records. The form schema transforms those
records into string IDs, which is the API payload. Rename the local schema to
`createUserFormSchema` and call `fromZod(createUserFormSchema)`. Remove
`CreateUserInput` because no current function consumes that raw type.

The roles schema preprocesses update input:

```ts
// apps/web/src/routes/(authenticated)/settings/roles/roles.schema.ts:8-21
export type RoleUpdate = Zod.input<typeof role.schemas.update>

const roleUpdateSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'realm'))
}, role.schemas.update)

update: { schema: fromZod<RoleUpdate>(roleUpdateSchema) }
```

`RoleUpdate` is imported by `roles.actions.ts` for its raw action input, so keep
it. Only remove the `fromZod` type argument.

The users resource spec already proves that object selections become role ID
strings. The roles resource spec covers the update behavior. Reuse those tests.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Special old calls | `rg -n "fromZod<" 'apps/web/src/routes/(authenticated)/settings/users/users.schema.ts' 'apps/web/src/routes/(authenticated)/settings/roles/roles.schema.ts'` | no output after migration |
| Users behavior | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/users/users.resource.spec.ts'` | exit 0 |
| Roles behavior | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/roles/roles.resource.spec.ts'` | exit 0 |
| Web type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API type-check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/settings/users/users.schema.ts`
- `apps/web/src/routes/(authenticated)/settings/roles/roles.schema.ts`
- `plans/README.md` for status only.

**Out of scope**:

- `CheckboxGroupInput.vue` and input registry code.
- API schemas, route handlers, database code, and request payloads.
- Users or roles actions, resources, routes, and UI layout unless a type-check
  proves that the schema-only call requires a narrow type-only correction.
- Framework source and tests; plan 037 owns them.
- Other application schema files; plan 038 owns them.

## Steps

### Step 1: Confirm raw and parsed boundaries

Run the drift check. Read the users resource test, `CheckboxGroupInput.vue`,
`roles.actions.ts`, and both schema files. Confirm that `CreateUserInput` has no
real caller and that `RoleUpdate` is still used by the roles action.

**Verify**: the current code matches this plan and the existing behavior tests
cover the two special paths.

### Step 2: Migrate the users schema

Rename `createUserValidation` to `createUserFormSchema`. Remove the unused
`CreateUserInput` alias. Use:

```ts
record: { schema: fromZod(user.schemas.select) },
create: { schema: fromZod(createUserFormSchema) },
update: { schema: fromZod(user.schemas.update) },
```

Keep the role selection union, uniqueness check, API schema extension, and
`UserUpdate` boundary unchanged.

**Verify**: the users resource spec passes and `rg -n "CreateUserInput|createUserValidation|fromZod<" 'apps/web/src/routes/(authenticated)/settings/users/users.schema.ts'` returns no output.

### Step 3: Migrate the roles schema

Keep `RoleUpdate` because `roles.actions.ts` consumes it. Replace only the
explicit `fromZod<Role>`, `fromZod<RoleCreate>`, and `fromZod<RoleUpdate>` calls
with schema-only calls. Keep `roleUpdateSchema` and its `realm` removal.

**Verify**: the roles resource spec passes and the special old-call command
returns no output.

### Step 4: Run application gates

Run the web type-check, web lint, and API type-check. Then run the final scan:

```sh
rg -n "fromZod<" apps/web/src packages/is-vue-framework/src
```

**Verify**: all commands exit 0; the app scan returns no output; and the only
framework matches are the bridge declaration and the intentional negative type
test.

### Step 5: Review the special cohort

Review the diff. Confirm that the users form still sends role ID strings, the
roles update still removes `realm`, and no raw draft type was added to the
resource contract.

**Verify**: `git diff --check` exits 0 and only the two schema files changed in
the application source.

## Test plan

- Reuse the users resource spec for role-object normalization and create/update
  schema behavior.
- Reuse the roles resource spec for the update preprocessing behavior.
- Run the complete web and API type gates.
- Do not add snapshots or a new generic draft abstraction.

## Done criteria

- [ ] Users uses `createUserFormSchema` with `fromZod(createUserFormSchema)`.
- [ ] `CreateUserInput` is removed because no real caller needs it.
- [ ] Roles keeps its preprocess and raw `RoleUpdate` action boundary.
- [ ] No explicit caller-supplied output call remains in the app or framework.
- [ ] Users and roles behavior tests pass.
- [ ] Web, API, lint, and whitespace gates pass.
- [ ] No out-of-scope file changed.
- [ ] `plans/README.md` marks plan 039 DONE after review.

## STOP conditions

- Stop if inferred users output is not compatible with the API create input.
- Stop if the role-ID transform or uniqueness validation changes behavior.
- Stop if `RoleUpdate` is needed for a raw caller not listed in this plan.
- Stop if a type-only correction requires changing the resource contract.
- Stop if a verification command fails twice after a focused fix.

## Maintenance notes

Keep input/output differences in local schemas. Add a raw input alias only for a
real function boundary. Do not classify a module as special only because its
resource has a custom action, nested route, or wire transform outside the schema.
