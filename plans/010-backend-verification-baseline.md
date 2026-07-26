# Plan 010: Establish a backend verification baseline (CI + lint for Sprindle and the API app)

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle apps/api .github/workflows`
> Changes attributable to plans marked DONE in `plans/README.md` are expected.
> Any other change: compare the "Current state" excerpts against live code
> before proceeding; on a mismatch, treat as STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

`packages/sprindle` (the backend framework) and `apps/api` (its only consumer) have working test suites but **no CI coverage and no linter**. The only workflow, `.github/workflows/web-validation.yml`, runs lint/type-check/test/build for `@southneuhof/framework-web` only — a broken Sprindle commit merges silently. Every subsequent backend plan (011–020) relies on "tests green + types green" as its verification gate; this plan makes that gate enforced rather than voluntary. It intentionally lands first.

## Current state

- `.github/workflows/web-validation.yml` — triggers on `apps/api/**` and package paths, but its `validate` job only runs `pnpm --filter @southneuhof/framework-web lint|type-check|test|build` (lines 63–75). Node `20.19.0`, pnpm `10.8.0` via corepack, `pnpm install --frozen-lockfile`.
- `packages/sprindle/package.json` — scripts: `build` = `pnpm run type-check`, `type-check` = `tsc -p tsconfig.json --noEmit`, `test` = `vitest run`. **No `lint` script.**
- `apps/api/package.json` — scripts: `build`/`type-check` = `tsc -p tsconfig.json --noEmit`, `test` = `node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run`. **No `lint` script.**
- `apps/web/package.json` — the repo's lint exemplar: `"lint": "eslint . --ext .vue,.js,... --ignore-path ../../.gitignore"` with a legacy `.eslintrc` file. It uses eslint 8-era config; do NOT copy the Vue plugin parts.
- Root `package.json` runs turbo tasks with `--filter=!base-mobile`; `pnpm lint` currently no-ops for backend packages (no script defined).
- `apps/api` tests hit a real Postgres via `DATABASE_URL` (see `apps/api/src/db.ts:14-16`); `apps/api/src/__tests__/products.spec.ts` uses `app.request()` against the real app. CI needs a Postgres service container for these.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| Sprindle types | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| Sprindle tests | `pnpm --filter @southneuhof/sprindle test` | all pass |
| API types | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass (needs `DATABASE_URL` + `APP_ORIGIN` + better-auth env; see `apps/api/.env.example`) |

## Scope

**In scope** (only files you may modify/create):
- `.github/workflows/backend-validation.yml` (create)
- `packages/sprindle/package.json` (add `lint` script)
- `apps/api/package.json` (add `lint` script)
- `packages/sprindle/eslint.config.js`, `apps/api/eslint.config.js` (create)
- Root `package.json` / workspace devDependencies only if needed to hoist eslint
- Source files ONLY for mechanical lint-fix changes (unused imports, etc.)

**Out of scope**:
- `.github/workflows/web-validation.yml` — leave untouched.
- Any behavioral change to framework or app code.
- Formatting tools (prettier/biome) — lint only, this round.

## Git workflow

- Branch: `codex/plan-010-backend-verification-baseline`
- Commit style: conventional with scope, e.g. `chore(sprindle): add lint and CI baseline` (repo examples: `feat(framework): add native resource definitions`).
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add eslint flat config to both packages

Add `eslint` ^9 and `typescript-eslint` ^8 as devDependencies (hoist at root or per-package — match how `apps/web` declares its own; per-package is fine). Create `eslint.config.js` in `packages/sprindle` and `apps/api` using `typescript-eslint` recommended (non-type-checked) config over `src/**/*.ts` (+ `scripts/**/*.ts` for the api). Keep rules minimal — the goal is a gate, not a style debate. Add scripts: `"lint": "eslint ."` to both package.jsons.

**Verify**: `pnpm --filter @southneuhof/sprindle lint && pnpm --filter @southneuhof/api lint` → exit 0 (fix only mechanical violations; if a rule demands a behavioral change, disable that rule instead).

### Step 2: Create `.github/workflows/backend-validation.yml`

Mirror the structure of `web-validation.yml` (checkout, Node 20.19.0, corepack pnpm 10.8.0, frozen-lockfile install, same `concurrency` pattern with group `backend-validation-...`). Trigger paths: `packages/sprindle/**`, `apps/api/**`, `packages/contracts/**`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.base.json`, the workflow file itself.

Job steps, in order:
1. `pnpm --filter @southneuhof/sprindle lint`
2. `pnpm --filter @southneuhof/sprindle type-check`
3. `pnpm --filter @southneuhof/sprindle test`
4. `pnpm --filter @southneuhof/api lint`
5. `pnpm --filter @southneuhof/api type-check`
6. `pnpm --filter @southneuhof/api test`

For step 6, add a Postgres service container (`postgres:16`, health-checked) and env: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres`, `APP_ORIGIN=http://localhost:5173`, plus any better-auth env `apps/api/.env.example` lists (`BETTER_AUTH_SECRET` may be a dummy value in CI — it is not a real credential). Before the test step run `pnpm --filter @southneuhof/api db:push` to create tables.

**Verify**: `npx --yes action-validator .github/workflows/backend-validation.yml` OR a YAML parse (`node -e "require('js-yaml')..."`); locally re-run all six commands → all pass.

### Step 3: Confirm turbo integration

`pnpm lint` at root must now include both backend packages without breaking. Run it.

**Verify**: `pnpm lint` → exit 0, output shows `@southneuhof/sprindle#lint` and `@southneuhof/api#lint` tasks executed.

## Test plan

No new tests — this plan adds gates around existing ones. Full suite is the test: all six job commands green locally.

## Done criteria

- [ ] `pnpm --filter @southneuhof/sprindle lint|type-check|test` all exit 0
- [ ] `pnpm --filter @southneuhof/api lint|type-check|test` all exit 0 (with local DB env)
- [ ] `.github/workflows/backend-validation.yml` exists and is valid YAML
- [ ] `git status` shows no modified files outside the Scope list
- [ ] `plans/README.md` row for 010 updated

## STOP conditions

- API tests fail on the unmodified baseline (before your changes) — the baseline itself is red; report instead of fixing app code.
- Lint cannot pass without >20 manual code edits — report the rule list for a decision instead of mass-editing.
- `apps/api/.env.example` requires a secret you cannot dummy in CI.

## Maintenance notes

- Plans 011–020 all cite these commands as gates; if script names change, update those plans' command tables.
- Reviewer: check the workflow's trigger paths cover `packages/sprindle` (the web workflow's omission of it is exactly the bug this fixes).
- Deferred: formatter, coverage reporting, publishing pipeline for the sprindle mirror repo.
