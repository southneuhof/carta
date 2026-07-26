# Plan 020: Dependency hygiene — unify Zod imports, isolate Drizzle internal-API access

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle packages/contracts apps/api`
> Changes attributable to plans marked DONE in `plans/README.md` are
> expected (011–017 touch the same files). Any other change: compare
> "Current state" excerpts against live code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (Zod import unification touches schema behavior; RC-internals isolation is refactor-only)
- **Depends on**: plans/010-backend-verification-baseline.md; run AFTER 011–017 to avoid rebasing them
- **Category**: tech-debt
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Two trap doors for future sessions. **(1) Zod split:** the framework imports `zod` (v3 classic API) in its validation schemas but `zod/v4` types in its RPC layer; app entities import `zod/v4`; the contracts parity test documents the mismatch and works around it by comparing shapes structurally. Any agent touching schemas must first rediscover which API dialect each file speaks. **(2) Drizzle RC internals:** the source layer reaches into `drizzle-orm@1.0.0-rc.4` private surfaces (symbol-keyed extra-config builders, `column._.column`). Any RC bump can break these silently, in confusing ways, far from the import site. Neither is a behavior bug today; both are exactly the kind of latent cost that gets paid at the worst time.

## Current state

**Zod split** (verify with `grep -rn "from 'zod" packages/sprindle/src apps/api/src packages/contracts/src`):
- v3-classic imports: `packages/sprindle/src/validation/common-schemas.ts:1` (`import { z } from 'zod'`).
- v4 imports: `packages/sprindle/src/hono/index.ts:2` (`import type { z } from 'zod/v4'`); app entities (`apps/api/src/routes/*/*.entity.ts`); framework specs (`install-sprindle.spec.ts:3`).
- Declared dep: `zod: ^3.25.0` in both `packages/sprindle` and `apps/api` — zod 3.25+ ships BOTH `zod` (classic) and `zod/v4` subpaths from one package.
- Parity workaround: `apps/api/src/__tests__/schema-parity.spec.ts:14-18` compares contracts (Zod3-style) against api schemas structurally because instanceof/API differ.
- Zod-shape sniffing that must survive: `domain-schema.ts:298-331` (`unwrapZod`/`getZodShape`/`isZodArray`/`getZodDef`) deliberately handles BOTH v3 (`typeName: 'ZodOptional'`, `_def`) and v4 (`type: 'optional'`, `def`) internals.
- `drizzle-zod: ^0.8.3` in apps/api generates the entity schemas — check which dialect it emits before deciding anything is removable.

**Drizzle internals** (all in `packages/sprindle/src`):
- `source/drizzle-source.ts:7` — `const tableSymbols = (Table as unknown as { Symbol: Record<'ExtraConfigBuilder' | 'ExtraConfigColumns', symbol> }).Symbol`
- `source/drizzle-source.ts:292-294` — reads `[tableSymbols.ExtraConfigBuilder]` / `[tableSymbols.ExtraConfigColumns]` off tables to find composite PKs (`PrimaryKeyBuilder` instances).
- `model/domain-schema.ts:283` — `(column as { _?: { column?: AnyColumn } })._?.column` in `getThroughColumns`.
- Pins: `drizzle-orm: 1.0.0-rc.4` (exact) in sprindle + api; `drizzle-kit: 1.0.0-rc.4` (api devDep). Exact pins are correct for an RC — keep them.

## Design (decided — implement as specified)

1. **Unify on `zod/v4`** as the single import dialect for all NEW-code-style files in `packages/sprindle` and `apps/api` (`import { z } from 'zod/v4'`). Package dep stays `zod ^3.25.0`. `packages/contracts` is browser-mirror territory — change it only if the parity test then simplifies; otherwise leave and note.
   - `common-schemas.ts` moves to v4 (its `z.coerce.number().int().positive()` / `z.object` / `z.enum` all exist in v4 — verify each parses identically via the schema's own tests).
   - The dual-dialect sniffing in `domain-schema.ts` STAYS (defensive; external sources may hand it either dialect).
2. **Isolate Drizzle internals** into one new file `packages/sprindle/src/source/drizzle-internals.ts` exporting exactly: `getPrimaryKeyEntries(table)` (move from drizzle-source.ts, including the symbol access) and `resolveThroughColumn(column)` (the `_.column` unwrap from domain-schema.ts). File-top comment: which private APIs, why, and the upgrade protocol ("on any drizzle-orm bump, run the canary spec first"). Everything else imports only public drizzle-orm API.
3. **Canary spec** `drizzle-internals.spec.ts`: builds a real `pgTable` with a composite `primaryKey(...)` and asserts extraction works — the test that fails FIRST and LOUDLY on an RC bump.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| Framework types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass (incl. schema-parity) |
| API types | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Import audit | `grep -rn "from 'zod'" packages/sprindle/src apps/api/src` | no matches (only `zod/v4`) |

## Scope

**In scope**:
- `packages/sprindle/src/validation/common-schemas.ts` (import swap)
- Any other `from 'zod'` classic import in `packages/sprindle/src` / `apps/api/src` surfaced by the audit grep
- `packages/sprindle/src/source/drizzle-internals.ts` (create) + `drizzle-source.ts` + `model/domain-schema.ts` (move/import)
- `packages/sprindle/src/source/__tests__/drizzle-internals.spec.ts` (create)
- `apps/api/src/__tests__/schema-parity.spec.ts` — ONLY if unification lets its workaround simplify; otherwise untouched

**Out of scope**:
- Bumping zod to ^4 proper or drizzle to a newer RC/stable — separate decision, not this plan.
- `packages/contracts` rewrites.
- The defensive dual-dialect sniffing in `domain-schema.ts:298-331` — keep.

## Git workflow

- Branch: `codex/plan-020-dependency-hygiene`
- Commits: `refactor(sprindle): unify zod imports on v4`, `refactor(sprindle): isolate drizzle internal-api access`, `test(sprindle): add drizzle internals canary`.

## Steps

### Step 1: Audit + unify Zod imports

Run the audit grep; swap each classic `from 'zod'` to `from 'zod/v4'`; fix any resulting API differences (v4 renames some methods — let type-check drive). `listQuerySchema`/`idParamSchema` behavior must be identical: coercion, defaults, max — covered by existing route tests.

**Verify**: audit grep → no classic imports; all four command-table commands green.

### Step 2: Extract `drizzle-internals.ts` + canary

Per Design. Pure move — no behavior change; `drizzle-source.ts` imports `getPrimaryKeyEntries` from the new module (note it's currently also exported via `getPrimaryKeyColumns` at `drizzle-source.ts:281-283` — preserve that public export's path or re-export). Write the canary spec (single-column PK table, composite `primaryKey({ columns: [...] })` table, error case for PK-less table).

**Verify**: `pnpm --filter @southneuhof/sprindle test` → all pass incl. canary; `grep -rn "ExtraConfigBuilder\|_\.\?column\b\|_?: { column" packages/sprindle/src --include=*.ts | grep -v drizzle-internals` → no hits outside the new module and its spec.

### Step 3: Parity-test check

Run `schema-parity.spec.ts`. If unification made its structural-comparison workaround removable, simplify it; if not, add one comment line pointing at this plan's decision.

**Verify**: `pnpm --filter @southneuhof/api test` → green.

## Test plan

Existing suites are the safety net (schemas and PK extraction are heavily exercised). New: the canary spec (Step 2). Regression case: composite-PK extraction still works post-move.

## Done criteria

- [ ] `grep -rn "from 'zod'" packages/sprindle/src apps/api/src` → zero matches
- [ ] All drizzle private-API access lives in `drizzle-internals.ts` (grep proof above)
- [ ] Canary spec exists and passes
- [ ] All commands green; no out-of-scope files; `plans/README.md` updated

## STOP conditions

- A v4 swap changes runtime behavior of `listQuerySchema`/`idParamSchema` (a route test fails) — report the exact API difference; don't quietly adjust the schema.
- `drizzle-zod`-generated schemas are v3-dialect and break under v4-importing consumers — report; the fix may belong in a drizzle-zod bump, not here.
- The `_.column` unwrap has no public-API equivalent AND the canary can't be written against public table builders — report what drizzle actually exposes.

## Maintenance notes

- Upgrade protocol now documented in `drizzle-internals.ts`: bump drizzle → run canary → if red, fix ONLY that file.
- When drizzle 1.0 goes stable, bump the exact pin and delete any workaround the changelog obsoletes; when zod 4.x becomes the declared dep, the `zod/v4` subpath imports keep working — that future bump becomes trivial BECAUSE of this plan.
- Reviewer: Step 2 must be a pure move — diff should show no logic edits inside the moved functions.
