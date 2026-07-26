# Plan 021: Make entity Zod schemas importable in the browser, and prove it on one resource

> **Implementation instructions**: Follow this plan step by step. Run every verification command
> and confirm the expected result before moving to the next step. If anything in the "STOP
> conditions" section occurs, stop and report — do not improvise. When done, update the status row
> for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat 4ab2c8f..HEAD -- packages/sprindle/src packages/is-vue-framework/src/validation packages/is-vue-framework/src/model-config apps/api/src/routes apps/web/src/framework packages/contracts/src
> ```
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts
> against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (runs on top of plans 000–020, all DONE)
- **Category**: tech-debt
- **Planned at**: commit `4ab2c8f`, 2026-07-27

## Why this matters

`packages/contracts/src/schemas/index.ts` is a **hand-written mirror** of the authoritative Zod
schemas that live in `apps/api/src/routes/*/*.entity.ts`. `apps/web` uses the mirror for
client-side form validation; `apps/api/src/__tests__/schema-parity.spec.ts` is the drift gate that
keeps the two in step.

That mirror costs one hand-written schema set per resource, forever. The repository's next planned
work (see `plans/NOTES-trom-proof-slice.md`) adds about ten tables at once, and the downstream
system it models has roughly two hundred. The mirror is the single thing that decides whether this
architecture scales to that, so it is worth removing before the slice, not after.

The mirror exists for one reason: the authoritative schemas are *runtime values* produced by
`drizzle-zod`, and those values could not previously reach a browser bundle. This plan removes the
blockers, proves the import works end to end on one resource, and **measures the bundle cost** so
the follow-up decision (delete the mirror entirely, or keep it and add codegen) is made on a number
rather than a guess.

### Design decision: widen the bridge, do not migrate every consumer

The obvious framing is "migrate everything from Zod 3 to Zod 4". Investigation showed that is both
unnecessary and riskier than the alternative:

- Every workspace package already declares `"zod": "^3.25.0"`. Nothing is on a different major.
  `apps/api` and `packages/sprindle` import the **`zod/v4` subpath** that ships inside zod 3.25.x;
  `packages/contracts` and `packages/is-vue-framework` import classic **`zod`** (v3). It is one
  installed package with two dialects, not two installed versions. (`zod@4.4.3` also appears in the
  lockfile, but only as a transitive dependency of `better-auth`'s `better-call` — no workspace
  package depends on it.)
- Therefore no dependency version bump is required, by anyone, at any point in this plan.
- A hard migration would force `packages/contracts` and every existing test to move dialects in the
  same change, for no benefit, while the mirror is still in place.

So this plan makes `packages/is-vue-framework`'s Zod bridge **dialect-agnostic**: it accepts either
dialect structurally and normalizes the internal metadata it reads. Both dialects then coexist
during the transition, which is exactly what the pilot needs (roles from the entity, everything
else still from the mirror).

### Verified facts about the two dialects

Probed against the actually-installed `zod@3.25.76`, both `zod` (classic) and `zod/v4`:

| Surface | classic (v3) | `zod/v4` |
|---|---|---|
| `.shape` | present | present |
| `.isOptional()` | present | present, correct |
| `.safeParse()` | present | present |
| `error.issues[].path` / `.message` | present | present, same paths for nested (`['address','city']`) and array (`['tags',0]`) |
| `_def.typeName` | `'ZodString'`, `'ZodOptional'`, … | **absent** (`undefined`) |
| `_def.type` | absent | `'string'`, `'optional'`, `'enum'`, `'default'`, `'nullable'`, `'array'`, `'date'`, … |
| enum options | `_def.values` (array) | `_def.entries` (object map); `_def.values` is `undefined` |
| `.refine()` on an object | `ZodEffects` wrapper | stays `_def.type === 'object'`, keeps `.shape` |
| `.transform()` | `ZodEffects`, inner at `_def.schema` | `_def.type === 'pipe'`, keys `type` / `in` / `out` |

Only `fromZod`'s metadata readers (`unwrap`, `inferFieldLayers`) touch `_def`. Everything else in
the bridge already works on both.

## Current state

### The mirror and its consumers

- `packages/contracts/src/schemas/index.ts` — hand-declared `roleSchemas` / `userSchemas` /
  `schemaManifest` / `findSchema`, classic Zod. Its header comment claims entity modules "pull in
  `node:crypto`, `drizzle-orm/pg-core`, and `drizzle-zod`". Only the first is actually a browser
  blocker; the comment is misleading and this plan corrects it.
- `apps/api/src/__tests__/schema-parity.spec.ts` — the drift gate. Compares the two structurally,
  casting both through a `SchemaLike` type because it cannot compare them as types.
- `apps/web/src/framework/adapters/validation/schemas.ts` — `schemaAdapter`, calls
  `findSchema(...)` then `fromZod(...)`. Repeats the same misleading comment.
- `apps/web/src/framework/adapters/resources/roles.ts:2` — `import { roleSchemas } from '@southneuhof/contracts'`, used at lines 48–51.
- `apps/web/src/framework/adapters/resources/users.ts:2` — same shape for `userSchemas`.

### The Zod bridge

`packages/is-vue-framework/src/validation/zod.ts`. Current metadata readers, verbatim:

```ts
// :48-57
const rendererByTypeName: Record<string, string> = {
  ZodString: 'text',
  ZodNumber: 'number',
  ZodBoolean: 'switch',
  ZodDate: 'date',
  ZodEnum: 'select',
  ZodNativeEnum: 'select',
  ZodArray: 'tag',
}

// :59-67
function unwrap(schema: ZodTypeAny): ZodTypeAny {
  const definition = (schema as unknown as { _def?: { typeName?: string; innerType?: ZodTypeAny; schema?: ZodTypeAny } })._def
  const typeName = definition?.typeName
  if (typeName === 'ZodOptional' || typeName === 'ZodNullable' || typeName === 'ZodDefault') {
    return unwrap(definition!.innerType as ZodTypeAny)
  }
  if (typeName === 'ZodEffects' && definition?.schema) return unwrap(definition.schema)
  return schema
}

// :74-95
export function inferFieldLayers(schema: ZodTypeAny): Record<string, FieldLayer> {
  const shape = objectShape(schema)
  if (!shape) return {}

  const layers: Record<string, FieldLayer> = {}
  for (const [key, value] of Object.entries(shape)) {
    const inner = unwrap(value)
    const typeName = (inner as unknown as { _def?: { typeName?: string } })._def?.typeName ?? ''
    const renderer = rendererByTypeName[typeName]
    if (!renderer) continue

    const layer: FieldLayer = { renderer }
    if (typeName === 'ZodEnum') {
      const options = (inner as unknown as { _def: { values: string[] } })._def.values
      layer.props = { options }
    }
    layers[key] = layer
  }
  return layers
}
```

The file's public surface is `normalizeZodIssues`, `requiredSchemaKeys`, `fromZod`,
`inferFieldLayers`, re-exported from `packages/is-vue-framework/src/validation/index.ts:1`.
`fromZod` is also re-exported from `validation/select.ts:78`.

The only other Zod references in the package are type-only: `model-config/types.ts:45` and `:92`
(`ZodTypeAny`), plus three test files that `import { z } from 'zod'`.

### Entity modules and their imports

Complete import set across every `apps/api/src/routes/*/*.entity.ts`:

```
drizzle-orm · drizzle-orm/pg-core · drizzle-zod · zod/v4 · node:crypto · @southneuhof/sprindle/model
```

`node:crypto` is imported **only** for `randomUUID` used inside `$defaultFn`, in
`apps/api/src/routes/users/users.entity.ts:1` and `apps/api/src/routes/auth/auth.entity.ts:1`:

```ts
import { randomUUID } from 'node:crypto'
// ...
id: text('id').primaryKey().$defaultFn(randomUUID),
```

The global `crypto.randomUUID` is available in browsers, in Node 18+, and in Vitest, and needs no
import.

`@southneuhof/sprindle/model` resolves to `packages/sprindle/src/model/index.ts`, which re-exports
`define-model.ts` — and that imports `Hono`. Entity files only need `createEntity` (and
`defineEntitySchemas`), which live in `model/domain-schema.ts`.

The import chain below `domain-schema.ts` was traced and is already browser-clean:

```
domain-schema.ts → drizzle-orm, source/drizzle-source.ts, source/drizzle-internals.ts, source/model-source.ts
drizzle-source.ts → drizzle-orm, errors.ts, drizzle-internals.ts, model-source.ts
drizzle-internals.ts → drizzle-orm, drizzle-orm/pg-core
errors.ts          → nothing
model-source.ts    → `import type { Context } from 'hono'`  (type-only, erased at build)
```

`createEntity` itself is cheap — `packages/sprindle/src/model/domain-schema.ts:62` builds a plain
object with `getTableName(...)` and an unbound source. It does not construct a Drizzle source.

### Existing package export map

`packages/sprindle/package.json` already exposes `.`, `./hono`, `./model`, `./routes`, `./openapi`,
`./source`, `./testing`, `./validation`.

### Existing web aliases

`apps/web` **already** resolves `@southneuhof/api` and `@southneuhof/api/*` in both
`apps/web/vite.config.ts` (the `alias` array) and `apps/web/tsconfig.app.json` (`paths`). No new
alias wiring is needed. It does **not** yet declare `@southneuhof/api` in `package.json`
dependencies.

### Repo conventions to match

- Comments explain *why*, in full sentences, above the construct. Match the tone of
  `packages/is-vue-framework/src/validation/select.ts` and `resources/controls.ts`.
- Vocabulary rule (from `plans/README.md`, "Shared architectural invariants"): public API names
  come from existing framework vocabulary, then Vue/HTML/TypeScript standard vocabulary, then plain
  English. Coined compounds are rejected in review.
- Tests use Vitest with `describe` / `it` / `expect`; model new tests on
  `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Sprindle tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Sprindle types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| Sprindle lint | `pnpm --filter @southneuhof/sprindle lint` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0, writes `apps/web/dist` |
| API types | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| API lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | see note below |

**Note on API tests**: they hit a real Postgres via `DATABASE_URL` (`apps/api/AGENTS.md`,
"Notes"). If no database is reachable in this environment they fail for reasons unrelated to this
plan. **Capture the baseline result before Step 1** and require only that this plan introduces no
*new* failures. Do not attempt to start, seed, or migrate a database as part of this plan.

## Scope

**In scope** (the only files you should modify or create):

- `packages/sprindle/src/entity/index.ts` (create)
- `packages/sprindle/package.json` (add one export entry)
- `packages/is-vue-framework/src/validation/zod.ts`
- `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`
- `apps/api/src/routes/users/users.entity.ts`
- `apps/api/src/routes/auth/auth.entity.ts`
- `apps/api/src/routes/roles/roles.entity.ts`
- `apps/api/src/routes/products/products.entity.ts`
- `apps/api/src/routes/product-variants/product-variants.entity.ts`
- `apps/web/package.json` (add one dependency)
- `apps/web/src/framework/adapters/resources/roles.ts`
- `apps/web/src/framework/__tests__/entity-schema-import.spec.ts` (create)
- `packages/contracts/src/schemas/index.ts` (**header comment only** — correct the claim about
  which imports block the browser)
- `apps/web/src/framework/adapters/validation/schemas.ts` (**header comment only** — same)
- `plans/README.md` (status row plus the amended rejected-finding line)
- `plans/021-browser-safe-entity-schemas.md` (this file — record the measurement in Step 6)

**Out of scope** (do NOT touch, even though they look related):

- `packages/contracts/src/schemas/index.ts` **schema declarations** — the mirror stays in this
  plan. Deleting it is the follow-up, gated on Step 6's measurement.
- `apps/api/src/__tests__/schema-parity.spec.ts` — the drift gate stays while the mirror stays.
- `apps/web/src/framework/adapters/resources/users.ts` — one pilot resource is the point. A second
  adds cost without adding information.
- `packages/contracts/src/index.ts`'s dead fake `AppType` — real finding, unrelated cleanup, and
  deleting it here would muddy this plan's diff.
- Moving entity modules into a package. `packages/domain` is **not** free: it holds
  `src/theme/materialTokens.ts` and is consumed by `apps/base-mobile/src/theme/material.ts`.
  Putting Drizzle entities there would drag `drizzle-orm` into the mobile app.
- Any `package.json` **version** change for `zod`. None is needed; see "Why this matters".
- `packages/is-vue-framework/src/model-config/types.ts` — its `ZodTypeAny` usages are type-only and
  Step 3 keeps them valid.

## Git workflow

- Branch: `advisor/021-browser-safe-entity-schemas`
- Conventional commits, matching `git log` style in this repo (for example
  `refactor(sprindle): unify zod imports and isolate drizzle internals`). Commit per step or per
  logical unit.
- Do NOT push or open a PR.

## Steps

### Step 1: Record the baseline

Before changing anything, capture three things and keep them for Step 6:

1. The API test result (pass, or the exact failure — likely a database connection error).
2. A green run of framework, web, and sprindle tests and type-checks.
3. The web bundle size:

```sh
pnpm --filter @southneuhof/framework-web build && du -sk apps/web/dist/assets && du -ck apps/web/dist/assets/*.js | tail -1
```

Record the total JS kilobytes. This is the **before** number.

**Verify**: the build exits 0 and a number is recorded.

### Step 2: Add a browser-safe `entity` subpath to Sprindle

Create `packages/sprindle/src/entity/index.ts`:

```ts
/**
 * Browser-safe entity surface.
 *
 * `./model` re-exports `defineModel`, which pulls in Hono and the route tree. Entity modules only
 * need to pair a table with its schemas, and application code that reads those schemas — a form in
 * the browser, for example — must be able to import them without the server runtime coming along.
 * This subpath exposes exactly that pair and nothing else.
 */
export { createEntity, defineEntitySchemas, isDomainEntity } from '../model/domain-schema'
export type { DomainEntity } from '../model/domain-schema'
```

Add the export to `packages/sprindle/package.json`, keeping the existing ordering style, directly
after `"./model"`:

```json
"./entity": "./src/entity/index.ts",
```

**Verify**:
```sh
pnpm --filter @southneuhof/sprindle type-check && pnpm --filter @southneuhof/sprindle lint && pnpm --filter @southneuhof/sprindle test
```
→ all exit 0, tests pass.

### Step 3: Make the Zod bridge dialect-agnostic

Edit `packages/is-vue-framework/src/validation/zod.ts` only. Three changes:

**3a. Accept either dialect structurally.** `fromZod`, `requiredSchemaKeys`, `inferFieldLayers` and
`unwrap` currently take `ZodTypeAny`, which is the classic-v3 type; a `zod/v4` schema is not
assignable to it. Introduce a structural parameter type and use it in those signatures. The file
already reads everything through casts, so this narrows nothing in practice:

```ts
/**
 * Structural stand-in for a Zod schema.
 *
 * Both Zod dialects in this repository — classic `zod` and the `zod/v4` subpath used by the API
 * entity modules — satisfy this shape, but their emitted types are unrelated, so a nominal
 * `ZodTypeAny` parameter would reject one of them. The bridge only ever reads `safeParse`,
 * `shape`, `isOptional` and `_def`, so the structural contract is the honest signature.
 */
export type ZodSchemaLike = {
  safeParse: (input: unknown) => { success: boolean; data?: unknown; error?: { issues: readonly ZodIssue[] } }
  isOptional?: () => boolean
  shape?: Record<string, unknown>
  _def?: Record<string, unknown>
}
```

Keep `ZodValidationSchema.source` typed as `ZodSchemaLike`. Keep `normalizeZodIssues` as it is —
its `ZodIssue` shape is identical across dialects (verified: same `path` arrays for nested and
array positions).

**3b. Normalize the type tag.** Replace the `typeName` reads with one helper that understands both
dialects, and rekey the renderer map on the normalized tag:

```ts
/**
 * One tag per schema kind, whichever dialect produced it. Classic Zod records `_def.typeName`
 * (`'ZodString'`); the v4 dialect records `_def.type` (`'string'`) and drops `typeName` entirely.
 */
function typeTag(schema: unknown): string {
  const definition = (schema as { _def?: { type?: string; typeName?: string } })._def
  if (!definition) return ''
  if (definition.type) return definition.type
  const legacy = definition.typeName
  return legacy ? legacy.replace(/^Zod/, '').toLowerCase() : ''
}

const rendererByTypeTag: Record<string, string> = {
  string: 'text',
  number: 'number',
  boolean: 'switch',
  date: 'date',
  enum: 'select',
  nativeenum: 'select',
  array: 'tag',
}
```

`unwrap` follows the same normalization. Wrapper tags are `'optional'`, `'nullable'`, `'default'`
in both dialects after normalization; the classic-only `'effects'` wrapper keeps its `_def.schema`
inner, and the v4 `'pipe'` wrapper exposes `_def.in`:

```ts
function unwrap(schema: ZodSchemaLike): ZodSchemaLike {
  const definition = schema._def as { innerType?: ZodSchemaLike; schema?: ZodSchemaLike; in?: ZodSchemaLike } | undefined
  if (!definition) return schema
  const tag = typeTag(schema)
  if (tag === 'optional' || tag === 'nullable' || tag === 'default') return unwrap(definition.innerType as ZodSchemaLike)
  if (tag === 'effects' && definition.schema) return unwrap(definition.schema)
  if (tag === 'pipe' && definition.in) return unwrap(definition.in)
  return schema
}
```

**3c. Read enum options from either place.** Classic exposes `_def.values` (array); v4 exposes
`_def.entries` (object map). In `inferFieldLayers`, for tag `'enum'`:

```ts
const definition = inner._def as { values?: string[]; entries?: Record<string, string> } | undefined
const options = definition?.values ?? (definition?.entries ? Object.values(definition.entries) : undefined)
if (options) layer.props = { options }
```

Do not change `objectShape`, `requiredSchemaKeys`'s logic, or `fromZod`'s body beyond the parameter
type — `.shape`, `.isOptional()`, `.safeParse` and `error.issues` are present and correct in both
dialects.

**Verify**:
```sh
pnpm --filter @southneuhof/is-vue-framework type-check && pnpm --filter @southneuhof/is-vue-framework test
```
→ exit 0; every existing test in `validation.spec.ts` still passes **unchanged**. Those tests use
classic `zod`, so they are the regression gate for dialect tolerance. If any of them needed editing
to pass, that is a STOP condition.

### Step 4: Add v4-dialect coverage to the bridge tests

Append a `describe('zod v4 dialect', ...)` block to
`packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`. Import the second dialect
alongside the existing one, leaving the existing import untouched:

```ts
import { z as z4 } from 'zod/v4'
```

Cover, mirroring the assertions the classic tests already make:

- `fromZod` returns parsed data on success for a v4 object schema.
- `fromZod` normalizes nested and array issue paths (`address.city`, `tags.0`) for v4.
- `requiredSchemaKeys` reports the same required keys for an equivalent v4 schema.
- `inferFieldLayers` infers `text` / `number` / `switch` / `select` from a v4 schema, and the
  `select` layer carries `props.options` derived from `_def.entries`.
- A v4 `.optional()` and a v4 `.default()` field still unwrap to their inner renderer.

**Verify**:
```sh
pnpm --filter @southneuhof/is-vue-framework test
```
→ all pass, including at least five new assertions in the new block.

### Step 5: Make the entity modules browser-safe and pilot one resource

**5a. Drop `node:crypto`.** In `apps/api/src/routes/users/users.entity.ts` and
`apps/api/src/routes/auth/auth.entity.ts`, delete the `import { randomUUID } from 'node:crypto'`
line and replace each `$defaultFn(randomUUID)` with `$defaultFn(() => crypto.randomUUID())`.

**5b. Import `createEntity` from the narrow subpath.** In all five entity files
(`users`, `auth`, `roles`, `products`, `product-variants` — whichever actually import it), change
`from '@southneuhof/sprindle/model'` to `from '@southneuhof/sprindle/entity'`. Do not change any
other import in those files.

**5c. Declare the dependency.** Add `"@southneuhof/api": "workspace:*"` to `apps/web/package.json`
dependencies, alongside the existing `@southneuhof/*` entries, then run `pnpm install`. The vite
and tsconfig aliases already exist; do not add more.

**5d. Pilot the roles resource.** In `apps/web/src/framework/adapters/resources/roles.ts`, replace
the mirror import with the authoritative entity schemas:

```ts
import { role } from '@southneuhof/api/routes/roles/roles.entity'
```

and use them in the `roles` resource definition:

```ts
  schemas: {
    create: fromZod<RoleDraft>(role.schemas.create),
    update: fromZod<RoleDraft>(role.schemas.update),
  },
```

Remove the now-unused `roleSchemas` import from that file. Leave `rolePermissions` and everything
else in the file alone. Add a short comment above `schemas` recording that these are the
authoritative server schemas, not a mirror.

**Verify**:
```sh
pnpm --filter @southneuhof/api type-check && pnpm --filter @southneuhof/api lint
pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/framework-web lint
```
→ all exit 0. Then run the API tests and confirm the result is **no worse** than the Step 1
baseline.

### Step 6: Prove the browser import and measure the cost

**6a. Add the guard test.** Create
`apps/web/src/framework/__tests__/entity-schema-import.spec.ts`. This replaces the parity test's
job for piloted resources: instead of proving two declarations match, it proves the single
declaration is importable and usable client-side.

Note that jsdom does **not** catch a node-builtin regression — Vitest runs jsdom on Node, so
`node:crypto` would still resolve and the runtime assertions would keep passing. The guard therefore
needs a **static scan** over every `*.entity.ts` under `apps/api/src/routes` asserting that none
imports a node builtin or `@southneuhof/sprindle/model`. Write both halves: runtime assertions for
usability, the scan for browser-safety.

Assert, at minimum:

- `role.schemas.create` and `role.schemas.update` are importable from
  `@southneuhof/api/routes/roles/roles.entity`.
- `fromZod(role.schemas.create).validate({ name: 'Admin' })` succeeds.
- `fromZod(role.schemas.create).validate({})` fails with an issue on `name`.
- `requiredSchemaKeys(role.schemas.create)` includes `name`.
- The module's own import graph is browser-clean — assert that importing it does not throw, and
  add a comment naming `node:crypto` as the regression this guards.

**6b. Measure.** Rebuild and compare against Step 1:

```sh
pnpm --filter @southneuhof/framework-web build && du -ck apps/web/dist/assets/*.js | tail -1
```

**6c. Record the verdict** by appending a "## Measurement" section to this plan file with: the
before number, the after number, the delta in kB and percent, and one of:

- **GO** — the delta is acceptable; the follow-up plan should migrate the remaining resources and
  delete both the mirror and `schema-parity.spec.ts`.
- **NO-GO** — the delta is too large; the mirror stays and the follow-up plan should evaluate a
  build-time codegen step that evaluates entities in Node and emits plain Zod.

Suggested threshold, to be confirmed by the maintainer rather than assumed: more than **+50 kB
gzipped** on the total JS is a NO-GO. State the raw and gzipped numbers either way.

**Verify**:
```sh
pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web build
```
→ tests pass including the new spec; build exits 0; the Measurement section exists and names GO or
NO-GO.

### Step 7: Correct the misleading comments and update the index

**7a.** In `packages/contracts/src/schemas/index.ts` and
`apps/web/src/framework/adapters/validation/schemas.ts`, correct the header comments. They
currently claim entity modules cannot be imported because they pull in `node:crypto`, Drizzle, and
`drizzle-zod`. State instead that entity modules **are** browser-importable as of this plan, that
`roles` already uses them directly, and that this manifest remains for the resources not yet
migrated. Do not change any schema declaration.

**7b.** In `plans/README.md`:

- Add a row for this plan. Place it in a new section rather than inside the two existing tables,
  since it belongs to neither the migration track nor the Sprindle-readiness track:

```markdown
## Contract track (added 2026-07-27)

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---|---|---|---|
| [021](021-browser-safe-entity-schemas.md) | Make entity Zod schemas importable in the browser | P1 | M | — | DONE |
```

- Amend the last line of "Findings considered and rejected", which currently reads:

```markdown
- Import API entity modules directly for validation: rejected if they carry server/database runtime dependencies; plan 003 requires a client-safe boundary.
```

Keep the original sentence and append that plan 021 removed the runtime dependency (`node:crypto`
plus the Hono-carrying `./model` subpath), so the condition attached to that rejection no longer
holds; the client-safe boundary from plan 003 is satisfied by the entity module itself.

- Add a pointer to `NOTES-trom-proof-slice.md` in the "Deferred work" section, noting that the
  accepted HKA TROM proof slice is recorded there and depends on this plan.

**Verify**: `git status` shows no modified file outside the in-scope list.

## Test plan

- **New**: five or more assertions in a `describe('zod v4 dialect', ...)` block in
  `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts` (Step 4). Structural
  pattern: the existing `describe('zod bridge', ...)` block in the same file.
- **New**: `apps/web/src/framework/adapters/__tests__/...` — no; the file is
  `apps/web/src/framework/__tests__/entity-schema-import.spec.ts` (Step 6a). Structural pattern:
  `apps/web/src/framework/__tests__/legacy-boundary.spec.ts`.
- **Regression gate**: every pre-existing test in `validation.spec.ts` must pass **unedited**. They
  exercise the classic dialect; if the bridge stopped accepting it, they fail.
- **Regression gate**: `apps/api/src/__tests__/schema-parity.spec.ts` must still pass (subject to
  the database caveat) — the mirror is still authoritative for `users`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm --filter @southneuhof/sprindle test`, `type-check`, `lint` all exit 0
- [ ] `pnpm --filter @southneuhof/is-vue-framework test` and `type-check` exit 0
- [ ] `pnpm --filter @southneuhof/framework-web test`, `type-check`, `lint`, `build` all exit 0
- [ ] `pnpm --filter @southneuhof/api type-check` and `lint` exit 0; `test` no worse than the Step 1 baseline
- [ ] `grep -rn "node:crypto" apps/api/src/` returns no matches
- [ ] `grep -n "roleSchemas" apps/web/src/framework/adapters/resources/roles.ts` returns no matches
- [ ] `grep -rn "@southneuhof/sprindle/model" apps/api/src/routes/*/*.entity.ts` returns no matches
- [ ] The new v4 `describe` block and `entity-schema-import.spec.ts` exist and pass
- [ ] This plan file contains a "## Measurement" section naming GO or NO-GO with before/after numbers
- [ ] `plans/README.md` has the 021 row, the amended rejected-finding line, and the notes pointer
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back — do not improvise — if:

- Any pre-existing test in `validation.spec.ts` requires editing to pass after Step 3. That means
  the bridge stopped accepting the classic dialect, which defeats the whole approach.
- Importing `@southneuhof/api/routes/roles/roles.entity` from a jsdom test or the Vite build fails
  with a module-resolution or node-builtin error that is not `node:crypto`. Record the exact error
  and the module it names; there is a server dependency this plan did not find.
- `pnpm --filter @southneuhof/framework-web build` fails to externalize or polyfill something inside
  `drizzle-orm` or `drizzle-zod`. Record the error; do not add polyfills or `define` shims to make
  it pass.
- The bundle delta in Step 6 exceeds the NO-GO threshold. Complete Steps 6c and 7 anyway, record
  NO-GO, and report — the measurement is the deliverable, so a NO-GO is a successful outcome, not
  a failure.
- The assumption "no workspace package depends on `zod@4.x` directly" turns out to be false.
- A step's verification fails twice after a reasonable fix attempt.

## Measurement

Measured on 2026-07-27 with `pnpm --filter @southneuhof/framework-web build`, then
`du -ck apps/web/dist/assets/*.js` and `cat apps/web/dist/assets/*.js | gzip -c | wc -c`.

| | Total JS (raw) | Total JS (gzip) | `roles` chunk (raw) |
|---|---|---|---|
| Before (mirror) | 860 kB | 264,222 B | 16,257 B |
| After (`roles` from the entity) | 1104 kB | 319,628 B | 262,411 B |
| **Delta** | **+244 kB (+28%)** | **+55,406 B (+21%)** | +246 kB |

### The cost is fixed, not per resource

The raw delta exceeded expectation enough to be worth a second data point, so `users` was
temporarily pointed at `user.schemas` as well, measured, and reverted (`users.ts` confirmed clean
by `git diff --quiet` afterwards):

| | Total JS (gzip) | Delta vs. previous |
|---|---|---|
| Mirror only | 264,222 B | — |
| `roles` from entity | 319,628 B | +55,406 B |
| `roles` + `users` from entity | 320,157 B | **+529 B** |

The second resource cost **529 bytes gzipped**. Essentially the entire delta is the one-time
`drizzle-orm` + `drizzle-zod` runtime, paid once by the first entity import and shared thereafter.
Extrapolating, the ten tables of the TROM proof slice would cost roughly 5 kB gzipped beyond the
entry fee, and two hundred models roughly 100 kB.

### Where the cost comes from

The bytes are not the schema; they are the machinery that constructs it. `role.schemas.create` is
the *result* of `createInsertSchema(roles)`, and evaluating that expression in a browser requires
shipping `drizzle-orm/pg-core`'s column-builder system (every column type, primary-key and
reference builders, table symbols, dialect plumbing), `drizzle-zod`'s column-to-Zod mapper — which
references every column type it can handle — and `drizzle-orm` core underneath both. The object
they produce is a handful of Zod fields.

Codegen would run that construction at build time in Node and emit only the result, which is why it
costs nothing at runtime. The measured split is exactly this: 55 kB of construction machinery paid
once and shared, 529 B of actual schema per resource. The type half of the contract (`hc<AppType>`)
is erased at build and costs nothing either way.

### Verdict: GO — accepted by the maintainer 2026-07-27

The pre-stated threshold of +50 kB gzipped was written before the measurement and assumed a
**per-resource** cost. The measurement disproved that: it is a fixed entry fee with a negligible
marginal rate. The threshold was therefore judging the wrong quantity, and the decision was
escalated rather than auto-flipped.

The maintainer accepted the entry fee on the grounds that this is an internal system application
where load time is not a primary constraint. **GO.**

Consequences for the follow-up plan:

1. Migrate the remaining resources to entity schemas (`users` today, and every resource added
   after).
2. Delete `packages/contracts/src/schemas/index.ts` and its `findSchema` manifest, and delete
   `apps/api/src/__tests__/schema-parity.spec.ts` — the drift gate has nothing left to guard once
   there is one declaration instead of two.
3. Repoint `apps/web/src/framework/adapters/validation/schemas.ts` at entity schemas, or remove the
   adapter if resource-level `schemas` cover every lookup.
4. Decide the entity modules' long-term home. `apps/web` importing from `apps/api` is a runtime
   app-to-app edge; a shared package is cleaner. `packages/domain` is **not** available — it holds
   `src/theme/materialTokens.ts` and `apps/base-mobile` consumes it, so entities there would drag
   `drizzle-orm` into the mobile app.

Options 2 and 3 of the earlier analysis (shrink the entry fee by splitting tables from schemas;
keep the mirror and add codegen) are **not being pursued**, and are recorded here so they are not
re-audited.

## Maintenance notes

- **The follow-up is gated on Step 6's number, not on preference.** Do not migrate the remaining
  resources or delete `packages/contracts/src/schemas/index.ts` and
  `apps/api/src/__tests__/schema-parity.spec.ts` inside this plan.
- **What a reviewer should scrutinize**: that Step 3 genuinely left the classic-dialect tests
  untouched (check `git diff` on `validation.spec.ts` shows additions only); that
  `apps/web/src/framework/adapters/resources/roles.ts` no longer imports from
  `@southneuhof/contracts`; and that the Measurement section quotes real command output rather than
  an estimate.
- **What will interact with this later**: any new entity module must import `createEntity` from
  `@southneuhof/sprindle/entity`, never `./model`, and must not import a node builtin. The guard
  test in Step 6a only covers `roles` — widening it to every entity belongs in the follow-up plan.
- **Deliberately deferred**: deleting the dead fake `AppType` in `packages/contracts/src/index.ts`;
  moving entity modules into a shared package; and migrating `packages/contracts` to the `zod/v4`
  dialect. None is required to answer this plan's question.
