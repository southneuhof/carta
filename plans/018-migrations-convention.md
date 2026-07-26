# Plan 018: Adopt versioned migrations and a seed convention (drizzle-kit wiring)

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- apps/api`
> Changes attributable to plans marked DONE in `plans/README.md` are
> expected. Any other change: compare "Current state" excerpts against live
> code; on mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (replaces the ad-hoc table-creation path both CI and dev flows rely on)
- **Depends on**: plans/010-backend-verification-baseline.md (CI invokes `db:push` today — this plan changes that call)
- **Category**: dx
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

There is no migrations story. `apps/api/drizzle.config.ts` exists, `drizzle-kit` is installed — but no migrations directory, no `db:generate`/`db:migrate` scripts. "Migration" today is a hand-written idempotent raw-SQL script (`scripts/push-products.ts`); teardown is a hardcoded drop list. No versioning, no history, no way to evolve a production schema safely. The mechanics come free from drizzle-kit; this plan wires them and records the convention. This is app tooling + convention, not framework surface — Sprindle core is untouched.

## Current state

- `apps/api/drizzle.config.ts` (verified, full file):
  ```ts
  export default defineConfig({
    schema: './src/routes/**/*.entity.ts',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL },
  })
  ```
  No `out` directory configured; no `drizzle/` or `migrations/` dir exists anywhere in the repo.
- `apps/api/package.json` scripts: `db:push` → `tsx scripts/push-products.ts` (raw `create table if not exists` SQL), `db:reset` → `drop-products.ts` + push, `db:smoke`. No generate/migrate.
- Entity files matched by the glob: `src/routes/{products,product-variants,auth,roles,users}/*.entity.ts` — includes better-auth's tables (`auth.entity.ts`).
- Dev flow: `pnpm --filter @southneuhof/api db:push` then `dev`/`test`. Plan 010's CI runs `db:push` before api tests.
- drizzle-kit version: `1.0.0-rc.4` (exact pin, devDependency).

## Design (decided — implement as specified)

- Migrations live in `apps/api/drizzle/` (drizzle-kit default `out`), committed to git.
- Scripts:
  - `db:generate` → `drizzle-kit generate` (diff entities vs migration history → new SQL file)
  - `db:migrate` → `drizzle-kit migrate` (apply pending, records history in `drizzle.__drizzle_migrations`)
  - `db:push` → **redefined** to `drizzle-kit push` (dev-only schema sync, no history) — keeps the familiar name for dev loops
  - `db:reset` → drop schema + `db:migrate` (reset via `drop schema public cascade; create schema public;` in a small script replacing `drop-products.ts`)
- Initial migration: one `db:generate` run against the current entities = migration `0000_*` capturing today's full schema.
- Seed convention: `apps/api/scripts/seed.ts` — a plain tsx script importing entities + `getDb()`, inserting idempotently (`onConflictDoNothing`); script name `db:seed`. No framework seed vocabulary — a seed is just a script; the convention (name, location, idempotency) is what's being established.
- CI (plan 010's workflow): `db:push` before tests becomes `db:migrate` — CI now also proves migrations apply cleanly from zero.
- `scripts/push-products.ts` and `scripts/drop-products.ts` are deleted.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Generate | `pnpm --filter @southneuhof/api db:generate` | new SQL file in `apps/api/drizzle/` |
| Migrate | `pnpm --filter @southneuhof/api db:migrate` | exit 0, tables exist |
| API tests | `pnpm --filter @southneuhof/api test` | all pass |
| Smoke | `pnpm --filter @southneuhof/api db:smoke` | exit 0 |

All need `DATABASE_URL` pointing at a disposable local Postgres.

## Scope

**In scope**:
- `apps/api/drizzle.config.ts` (add `out: './drizzle'`), `apps/api/package.json` (scripts), `apps/api/drizzle/**` (generated, committed)
- `apps/api/scripts/` — delete `push-products.ts`/`drop-products.ts`, add `reset-db.ts`, `seed.ts`
- `.github/workflows/backend-validation.yml` (swap push→migrate)
- `apps/api/README.md` or `.env.example` comments if setup steps are described there

**Out of scope**:
- `packages/sprindle/**` — nothing framework-side.
- Production deployment/rollback tooling.
- Down migrations (drizzle-kit is forward-only; that is the accepted convention).

## Git workflow

- Branch: `codex/plan-018-migrations-convention`
- Commits: `feat(api): adopt drizzle-kit versioned migrations`, `feat(api): add seed convention`.

## Steps

### Step 1: Configure `out` and generate the initial migration

Add `out: './drizzle'` to `drizzle.config.ts`. Run `db:generate` (add the script first). Inspect the generated SQL: it must contain the tables the old `push-products.ts` created (open that script and compare table lists before deleting anything).

**Verify**: `ls apps/api/drizzle/*.sql` → exactly one migration; its `CREATE TABLE` set ⊇ the old script's set.

### Step 2: Migrate a clean database and run the suite

Against a fresh database: `db:migrate`, then `pnpm --filter @southneuhof/api test` and `db:smoke`.

**Verify**: all green from a zero database with NO run of the legacy push script.

### Step 3: Replace scripts, wire CI, delete legacy

Add `db:push` (drizzle-kit push), `reset-db.ts` + `db:reset`, `seed.ts` + `db:seed` per Design. Delete `push-products.ts`/`drop-products.ts`. Update the CI workflow step from `db:push` to `db:migrate`.

**Verify**: `db:reset` then `db:migrate` then tests → green; `grep -rn "push-products" apps/api .github` → no matches.

## Test plan

No new unit tests — the verification IS the test: clean-DB migrate + full api suite + smoke. Seed script: run twice, second run exits 0 with no duplicate rows (idempotency check inside the script or by re-running tests).

## Done criteria

- [ ] `apps/api/drizzle/` committed with the initial migration + drizzle-kit journal
- [ ] Fresh-DB flow (`db:migrate` → `test` → `db:smoke`) green with legacy scripts deleted
- [ ] CI workflow uses `db:migrate`
- [ ] `db:seed` idempotent (runs twice cleanly)
- [ ] No out-of-scope files; `plans/README.md` updated

## STOP conditions

- `db:generate` output diverges structurally from what `push-products.ts` created (extra/missing columns beyond obvious additions) — the entities and the legacy SQL disagree; report the diff, don't pick a side.
- drizzle-kit `1.0.0-rc.4` generate/migrate commands error or use different subcommand names — report actual CLI surface (RC churn is real).
- better-auth requires tables its entity file doesn't declare (migration leaves auth broken) — report.

## Maintenance notes

- Convention to document in plan 019: schema change = edit `*.entity.ts` → `db:generate` → review SQL → commit both → `db:migrate`. Never edit applied migrations.
- Plan 020 may bump drizzle-kit — migrations format compatibility must be checked there.
- Reviewer: confirm the migration journal (`drizzle/meta/`) is committed, not gitignored.
