# Plan 037: Establish schema-first Zod inference

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command before moving to the next step. If a STOP condition
> occurs, stop and report it. This plan changes the framework seam only. The
> application callsites are handled by plans 038 and 039.
>
> **Drift check (run first)**: `git diff --stat ab4c5ca..HEAD -- packages/is-vue-framework/src/validation packages/is-vue-framework/src/contracts packages/is-vue-framework/README.md docs/architecture docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md .agents/skills/implement-schema-first-zod`
>
> The current worktree contains uncommitted resource migration files from
> plans 034-036. Preserve them. Compare the listed framework and documentation
> files with the current state before editing.

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/036-remove-action-field-maps-and-reconcile-docs.md
- **Category**: tech-debt
- **Planned at**: commit `ab4c5ca`, 2026-08-12

## Why this matters

`fromZod` currently accepts a caller-supplied output type that is not connected
to the Zod schema. A wrong type can compile and then be returned from the
runtime parser through a cast. The correct call is `fromZod(schema)`, so the
schema is the only source for parsed output.

This plan establishes that public contract and proves it for classic Zod,
`zod/v4`, and transforms. It does not migrate application schemas. That keeps
the framework change separate from the application migration.

## Current state

The public validation contract uses its first generic for parsed output:

```ts
// packages/is-vue-framework/src/contracts/validation.ts:21-23
export interface ValidationSchema<TOutput = unknown, TInput = unknown> {
  validate: (input: TInput) => ValidationResult<TOutput>
}
```

The bridge erases that output type:

```ts
// packages/is-vue-framework/src/validation/zod.ts:32-37, 81-89
export type ZodSchemaLike = {
  safeParse: (input: unknown) => { success: boolean; data?: unknown; error?: { issues: readonly ZodIssueLike[] } }
  isOptional?: () => boolean
  shape?: Record<string, unknown>
  _def?: unknown
}

export function fromZod<TOutput>(schema: ZodSchemaLike): ZodValidationSchema<TOutput> {
  // ...
  validate: (input: unknown): ValidationResult<TOutput> => {
    const result = schema.safeParse(input)
    if (result.success) return { success: true, data: result.data as TOutput }
    // ...
  }
}
```

`packages/is-vue-framework/src/validation/__tests__/validation.spec.ts` tests
both Zod dialects, but lines 23 and 133 still use the old explicit generic.
The package has no Zod runtime dependency. The bridge must stay structural.

## Design

Use the schema's structural `_output` property:

```ts
type ZodOutput<TSchema extends ZodSchemaLike> = TSchema['_output']

export function fromZod<TSchema extends ZodSchemaLike>(
  schema: TSchema,
): ZodValidationSchema<ZodOutput<TSchema>>
```

`ZodSchemaLike` must require `_output`, while its runtime members remain
structural. Keep the internal cast from `safeParse().data` because the runtime
contract is structural. Do not expose an output type parameter, add an overload,
fall back to `unknown`, or add a Zod dependency.

The resource contract remains unchanged. `AppResourceContract` checks that the
parsed schema output is compatible with Hono request JSON. Raw form input stays
inside a local schema or a real function boundary.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework type-check | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Legacy framework callsites | `rg -n "fromZod<" packages/is-vue-framework/src --glob '!**/validation/zod.ts' --glob '!**/validation/__type-tests__/zod.type-test.ts'` | no matches |
| Whitespace | `git diff --check` | exit 0 |

Web type-check is intentionally deferred until plans 038 and 039 remove the
application callsites that still use the old signature.

## Scope

**In scope**:

- `packages/is-vue-framework/src/validation/zod.ts`
- `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`
- `packages/is-vue-framework/src/validation/__type-tests__/zod.type-test.ts`
- `packages/is-vue-framework/README.md`
- `docs/architecture/web-application-architecture.md`
- `docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md`
- `.agents/skills/implement-schema-first-zod/SKILL.md`
- `plans/README.md` for status only

**Out of scope**:

- All `apps/web` schema files; plans 038 and 039 own them.
- `packages/is-vue-framework/src/contracts/validation.ts` and
  `packages/is-vue-framework/src/contracts/schema.ts`, unless the compiler
  proves that a narrow correction is required.
- `CheckboxGroupInput.vue`, API schemas, route handlers, database code, and
  request payloads.
- Resource actions, fields, routes, permissions, and UI layout.
- Existing uncommitted migration files from plans 034-036.
- An exported `CreateUserFormDraft` type.

## Steps

### Step 1: Confirm the seam

Run the drift check. Read `zod.ts`, its tests, the type-test examples, and the
current public exports. Confirm that both installed Zod dialects expose `_output`
and that no framework caller needs a typed raw form input.

**Verify**: the current code matches this plan, and the old explicit calls are
limited to the framework tests and the app files assigned to plans 038-039.

### Step 2: Make `fromZod` schema-first

Change only `packages/is-vue-framework/src/validation/zod.ts`. Infer the return
type from `_output`. Preserve issue normalization, required-key inspection,
field-layer inference, and runtime behavior.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 3: Prove the pit

Remove the explicit generic from the two runtime tests. Add a focused type test
covering classic Zod, `zod/v4`, a transform with different input and output,
and `// @ts-expect-error` for `fromZod<TOutput>(schema)`. Add one runtime test
that asserts the transformed parsed output.

**Verify**: the framework test and type-check commands exit 0.

### Step 4: Reconcile guidance

Document `fromZod(schema)` as the only bridge call. State that parsed schema
output supplies the resource value and that raw form types are local and
optional. Update the implementation skill to point to plans 037, 038, and 039.
Do not describe the removed generic overload as supported.

**Verify**: `rg -n "fromZod<" packages/is-vue-framework/README.md docs` returns no stale public API example. The implementation skill may show the removed call as a rejected anti-example.

### Step 5: Review the foundation

Review the scoped diff. Confirm that no application schema or unrelated
migration file changed. Leave the old app calls for plans 038 and 039.

**Verify**: `git diff --check` exits 0 and the scope review is clean.

## Test plan

- Extend `validation.spec.ts` with direct transform-output coverage.
- Add `validation/__type-tests__/zod.type-test.ts` using the package's existing
  type-test pattern.
- Do not add one test per application schema.

## Done criteria

- [ ] `fromZod(schema)` infers parsed output for classic Zod and `zod/v4`.
- [ ] A transform's parsed output is preserved at runtime and in TypeScript.
- [ ] `fromZod<TOutput>(schema)` is rejected by the type test.
- [ ] No legacy caller-supplied output call remains in framework source or tests;
  the bridge declaration and the intentional negative type test are the only
  remaining `fromZod<` text.
- [ ] Documentation and the implementation skill describe only the schema-only API.
- [ ] No out-of-scope source file changed.
- [ ] `plans/README.md` marks plan 037 DONE after review.

## STOP conditions

- Stop if either supported Zod dialect has no usable structural `_output`.
- Stop if schema-only inference loses the parsed output type.
- Stop if the framework package requires a Zod runtime dependency.
- Stop if a contract change or an input component change appears necessary.
- Stop if a verification command fails twice after a focused fix.

## Maintenance notes

Review future bridge changes for caller-supplied casts, `unknown` fallbacks, or
raw form generics. If a UI control has a different raw shape, keep its transform
in the local schema and make its parsed output match the transport contract.
