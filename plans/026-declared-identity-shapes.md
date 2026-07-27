# Plan 026: Declared identity shapes with composite support

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat e4f345c..HEAD -- packages/is-vue-framework/src apps/web/src/framework
> ```
> This plan was written against commit `e4f345c`. If `contracts/load.ts`, `contracts/resource.ts`, or
> `resources/defineResource.ts` differ from the excerpts below, reconcile before proceeding. The
> design being implemented is the Addendum of
> `docs/architecture/routing-and-controls-review.md` — read it first; it is the specification.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (type-inference machinery; zero intended runtime behavior change)
- **Depends on**: —
- **Category**: web architecture (identity / controls / routing track)
- **Planned at**: commit `e4f345c`, 2026-07-27

## Why this matters

The framework currently hardcodes `RecordIdentity = string | number`
(`packages/is-vue-framework/src/contracts/load.ts:32`) and defaults extraction to `record.id`
(`resources/defineResource.ts:145`). Composite identities (a record addressed by two keys, e.g. a
`userRole` assignment) can only be faked by string-encoding. The decided design makes `{id}` a
**default, not a contract**: the resource declares its identity shape once, and the type threads from
that declaration through every operation, factory, and route builder — so `detail({ id: 'x' })` on a
composite resource fails to compile.

This plan is deliberately self-contained: contracts and `defineResource` only. Plans 027 and 028
build on `TIdentity`; nothing in `apps/web/src/routes` changes here, and every existing resource
definition must keep compiling **unchanged** (they all use the scalar default).

## Current state

- `contracts/load.ts` — `RecordIdentity = string | number`; `RecordLoadContext.id?: RecordIdentity`.
- `contracts/resource.ts` — `identity?: (record: TRecord) => RecordIdentity` on
  `ResourceDefinitionBase`; `DetailFactoryArguments.id: RecordIdentity`;
  `UpdateFormFactoryArguments.id: RecordIdentity`; four generics on `Resource`.
- `resources/defineResource.ts` — `identity` defaults to `(record) => record.id`; `routes` is
  `ResourceRouteTargets` with `(id: RecordIdentity) => string` builders; `remove`, `invalidate`,
  `form({ id })`, and the memoized factories all take scalar ids. `resource.identity` currently has
  **zero call sites** outside its definition — plan 027 gives it its first consumer (row links).
- Cache keys go through `stableValue` (`query/keys.ts`), which already serializes objects
  deterministically.
- Type tests live in `contracts/__type-tests__/contracts.type-test.ts`; unit tests in
  `resources/__tests__/`.

## Commands you will need

| Purpose | Command |
|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` |
| Framework types (build) | `pnpm --filter @southneuhof/is-vue-framework build` |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` |
| Web tests | `pnpm --filter @southneuhof/framework-web test` |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/{load.ts,resource.ts}` and the contracts type tests
- `packages/is-vue-framework/src/resources/defineResource.ts` and its unit tests
- `packages/is-vue-framework/src/resources/controls.ts` — signature only, if the compiler forces it
  (the real rework is plan 027)

**Out of scope** (later plans or never):

- Any file under `apps/web/src/routes` (plan 028)
- Folding controls into factories (plan 027)
- Route-param auto-assembly (plan 028 — it is router-coupled)
- Identity codecs / number coercion from URLs — decided against; URL-sourced values are strings
- Deriving `routes.*` strings from identity keys — decided against (sugar not worth vocabulary)

## Steps

### Step 1: Widen the identity contracts

In `contracts/load.ts`:

```ts
/** One scalar component of a record identity. */
export type RecordIdentityValue = string | number
/** Stable identity of one record: a scalar, or a flat record of scalars for composite keys. */
export type RecordIdentity = RecordIdentityValue | Readonly<Record<string, RecordIdentityValue>>
```

Make `RecordLoadContext` generic — `RecordLoadContext<TIdentity extends RecordIdentity = RecordIdentity>`
with `id?: TIdentity` — defaulting so every existing usage compiles unchanged.

In `contracts/resource.ts`: add `TIdentity extends RecordIdentity = RecordIdentityValue` to
`DetailFactoryArguments`, `UpdateFormFactoryArguments`, `ResourcePropFactories`, `Resource`, and
`ResourceInvalidationArguments`, threading `id: TIdentity`. The `identity` member on
`ResourceDefinitionBase` becomes the two-spelling union (see Step 2). Defaults keep all four existing
generics' call sites source-compatible.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework build` — green with no changes yet to
`defineResource.ts` beyond what the compiler demands.

### Step 2: Two identity spellings with inference

In `defineResource.ts` (and mirrored in the contracts):

```ts
identity?: readonly (keyof TRecord & string)[] | ((record: TRecord) => TIdentity)
```

- **List form** `identity: ['userId', 'roleId']` (with a `const` type parameter so the tuple's
  literal types survive): infers `TIdentity = Pick<TRecord, 'userId' | 'roleId'>` and derives the
  runtime extractor by picking those keys off the record.
- **Function form**: `TIdentity` inferred from the return type; the function is the extractor.
- **Omitted**: `TIdentity = RecordIdentityValue`, extractor `(record) => record.id` — today's exact
  behavior.

`TIdentity` is **inferred, never manually supplied**. Achieve this with a `const` generic on the
tuple and conditional-type resolution from the `identity` property; do not add a fifth required type
argument to `defineResource`'s public signature.

**Verify**: a scratch composite definition in the type tests infers the pair type; all existing
adapter definitions in `apps/web/src/framework/adapters/resources/*.ts` compile with zero edits
(`pnpm --filter @southneuhof/framework-web type-check`).

### Step 3: Thread `TIdentity` through operations, routes, and factories

Still in `defineResource.ts`:

- `ResourceOperations`: `detail` context `id`, `update(id, input)`, `delete(id)` become `TIdentity`.
  This is the **loader consistency check** from the Addendum: a fetcher expecting a scalar on a
  composite resource is now a compile error at the `defineResource` call site.
- `ResourceRouteTargets<TIdentity>`: `detail` and `update` builders take `TIdentity`.
- `detail({ id })`, `form({ id })`, `remove(id)`, `invalidate({ id })` take `TIdentity`. Memoization
  and cache invalidation need no logic change — `stableValue` serializes object ids; confirm the
  invalidation key path (`invalidateResourceData`) passes the id through `stableValue` rather than
  `String(id)`. If any code path stringifies with `String(...)`, route it through `stableValue`.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework build && pnpm --filter @southneuhof/is-vue-framework test`.

### Step 4: Type tests

In `contracts/__type-tests__/contracts.type-test.ts` (extend, keep existing cases):

- Composite resource: `detail({ id: 'x' })` — `// @ts-expect-error`; `detail({ id: { userId, roleId } })` — OK.
- Scalar resource: `detail({ id: { userId: 'x' } })` — `// @ts-expect-error`.
- Loader mismatch: composite `identity` with a scalar-id `operations.detail` — `// @ts-expect-error`.
- `routes.update` builder receiving the composite object — OK; receiving a scalar — error.
- No-`identity` resource: everything compiles exactly as before (copy one existing fixture verbatim).

**Verify**: `pnpm --filter @southneuhof/is-vue-framework build` (type tests are compile-checked).

### Step 5: Runtime tests

In `resources/__tests__/` add cases:

- List-form extractor picks exactly the declared keys (extra record fields excluded).
- Function-form extractor used verbatim.
- Default extractor returns `record.id`.
- `invalidate({ id: { userId: 'a', roleId: 'b' } })` and `invalidate({ id: { roleId: 'b', userId: 'a' } })`
  produce the same key (object key order must not matter — this is the "serialization, not
  semantics" guarantee at the cache layer).

**Verify**: `pnpm --filter @southneuhof/is-vue-framework test` green, then the full web suite
(`pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check`)
green with **zero** app-code edits.

## Done criteria

- Composite identity is expressible via list and function spellings; `{id}` scalar remains the
  unconfigured default.
- `TIdentity` is inferred from the definition and enforced end-to-end (factories, operations, route
  builders, invalidation); the four misuse cases in Step 4 fail to compile.
- Every pre-existing resource definition, test, and route file compiles and passes untouched.
- `plans/README.md` row updated.

## STOP conditions

- Inference cannot be achieved without a manually supplied type parameter at any **existing**
  `defineResource` call site — stop; the ergonomics regression was explicitly ruled out.
- The list-form `keyof` constraint forces `fields` or other generics to widen in a way that breaks an
  existing adapter definition — stop and report the exact inference conflict.
- Cache invalidation for object ids requires changes inside `query/client.ts` beyond routing through
  `stableValue` — stop; that file is shared surface and the blast radius was assumed to be nil.

## Maintenance notes

- Record here (or in the Addendum) any deviation in the exact conditional-type spelling, for plan
  027's benefit — it consumes `TIdentity` in the factory return bundles.

### Implemented spelling (2026-07-27)

`defineResource` takes a fifth **optional** `const TDeclaration extends IdentityDeclarationInput<TRecord> | undefined = undefined`
type parameter — the literal type of the `identity` value, not the identity itself. Everything
downstream reads `ResolvedIdentity<TRecord, TDeclaration>` (in `resources/defineResource.ts`), which
maps a key list to `{ [K in keys]: TRecord[K] }`, a function to its return type, and `undefined` to
`RecordIdentityValue`.

Two deviations, both forced by TypeScript rather than by the design:

1. **A partially supplied type-argument list takes defaults, not inference.** A call site that spells
   `defineResource<User, UserQuery, …>` explicitly — the house style in
   `apps/web/src/framework/adapters/resources/*.ts` — must spell the declaration as the fifth
   argument too (`defineResource<UserRole, Q, D, D, readonly ['userId', 'roleId']>`), otherwise the
   identity silently resolves to the scalar default. Full inference works at a call site that spells
   **no** type arguments: `TRecord`/`TCreate` then come from the `fields` catalog and the declaration
   from `identity`. The tuple is checked against the `identity` value either way, so the duplication
   cannot drift. This is not the plan's STOP condition — no existing call site needs a manual type
   parameter (all use the scalar default) — but it is the ergonomics ceiling TypeScript allows.
2. **The function spelling needs its parameter annotated** (`identity: (record: UserRole) => …`) when
   `TRecord` is itself being inferred from `fields`; inference cannot run in both directions at once.

Also changed: the update-form namespace was `${key}.update.${String(id)}`, which would render a
composite identity as `[object Object]`. It now goes through `identityToken`, which keeps `String`
for scalars (namespace strings appear in URLs — existing ones are unchanged) and stable JSON for
objects. Cache keys already ran through `stableValue`; `query/client.ts` needed no change.
- If a real composite resource lands during this plan, prefer adding it to the type tests over
  inventing a fixture.
