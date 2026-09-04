---
name: implement-schema-first-zod
description: Implement and review the schema-first Zod type-inference migration for this Carta repository. Use when changing `fromZod`, `ZodSchemaLike`, app schema files, Zod bridge tests, or the related architecture documentation; the required result is `fromZod(schema)` with parsed output inferred from the schema and no caller-supplied output type.
---

# Implement Schema-First Zod

Make the runtime schema the only type source for the Zod bridge. Execute plans
037, 038, and 039 in order. Preserve support for classic Zod and `zod/v4`.
Keep raw form types outside the standard resource contract.

## Required reads

- `AGENTS.md`
- `plans/037-schema-first-zod-type-inference.md`
- `plans/038-migrate-generic-app-zod-schemas.md`
- `plans/039-migrate-special-app-zod-schemas.md`
- `.agents/skills/pit-of-success/SKILL.md`
- `packages/loom/src/validation/zod.ts`
- `packages/loom/src/validation/__tests__/validation.spec.ts`
- every result from `rg -n "fromZod<|fromZod\\(" apps/web/src packages/loom/src`

## Non-negotiable target

Use this public shape:

```ts
fromZod(createUserFormSchema)
```

Do not use this shape:

```ts
fromZod<CreateUserInput>(createUserFormSchema)
```

The bridge must infer parsed output from the structural `_output` metadata
shared by the supported Zod dialects. Require `_output` in the schema
constraint. Do not add a Zod runtime dependency, an output-type overload, or an
`unknown` fallback.

## Workflow

### 1. Preflight

- Run the selected plan's drift check.
- Check `git status --short`; preserve unrelated resource migration changes.
- Enumerate all callers with:

  ```sh
  rg -n "fromZod<|fromZod\\(" apps/web/src packages/loom/src
  ```

- Confirm which `z.input` and `z.output` aliases have real callers. Remove only
  dead aliases. Do not create a raw draft alias by default.

Stop if the plan's current-state excerpts do not match the live code.

### 2. Execute the framework foundation

In `packages/loom/src/validation/zod.ts`:

- keep `ZodSchemaLike` structural for classic Zod and `zod/v4`;
- require `_output`;
- derive the return type from `_output`;
- keep issue normalization, required-key inspection, and field-layer inference;
- keep any runtime cast internal to the adapter.

Add one runtime transform test and one type test for classic Zod, `zod/v4`,
different input/output, and rejection of a caller-supplied output type.

Do not change `WebResourceSchema`, `ValidationSchema`, input components, or API
schemas.

### 3. Execute the generic app cohort

Replace `fromZod<Type>(schema)` with `fromZod(schema)` in the ten direct schema
files named by plan 038. Preserve `AppResourceContract` and any type alias used
by an action function. Do not change resource actions or API payloads.

The web type-check remains a final gate until the special cohort is complete.

### 4. Execute the special app cohort

In `users.schema.ts`, rename `createUserValidation` to
`createUserFormSchema`, remove the unused `CreateUserInput` alias, and keep the
selected-record-to-role-ID transform and uniqueness rule.

In `roles.schema.ts`, keep `roleUpdateSchema` and the raw `RoleUpdate` alias
used by `roles.actions.ts`. Remove only the explicit `fromZod` type arguments.

Do not add a resource-level raw draft type.

### 5. Reconcile guidance

Keep framework README, architecture docs, the design specification, and this
skill on the schema-only bridge. Document raw form types only as local optional
boundaries. Do not document the removed generic overload as supported.

### 6. Verify and review

Run:

```sh
rg -n "fromZod<" apps/web/src
rg -n "fromZod<" packages/loom/src --glob '!**/validation/zod.ts' --glob '!**/validation/__type-tests__/zod.type-test.ts'
pnpm --filter @southneuhof/loom test
pnpm --filter @southneuhof/loom type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web lint:check
pnpm --filter @southneuhof/api type-check
git diff --check
```

Expect no `fromZod<` matches in application source or framework caller files.
The bridge declaration and the intentional negative type test are allowed.
Expect exit code 0 from every command. Review the scoped diff. Do not commit,
push, or touch unrelated migration files.

## Review checklist

- `fromZod(schema)` is the only public call shape.
- Parsed output comes from `_output`, including transforms.
- Classic Zod and `zod/v4` remain structural and supported.
- Users keeps UI normalization inside its local form schema.
- Roles keeps its `realm` preprocess and raw action boundary.
- No raw form generic was added to the resource contract.
- No unrelated worktree change was reverted.
