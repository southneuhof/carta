# Plan 006: Add non-mutating web lint and CI validation gates

> **Executor instructions**: Follow the plan in order. This plan establishes a zero-error lint baseline and CI gate; do not run the current mutating lint script before changing it. Run all verification commands and update `plans/README.md` when complete unless a reviewer owns the index.
>
> **Drift check (run first)**: `git diff --stat b5402b7..HEAD -- apps/web/package.json apps/web/.eslintrc.cjs apps/web/postcss.config.js apps/web/tailwind.config.js apps/web/src/components/navigations/sidebar/rail apps/web/src/routes/'(public)'/privacy-policy/privacy-policy.route.vue apps/web/src/utils/services.ts .github/workflows`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/001-restore-catch-all-route.md`, `plans/003-make-login-transactional.md`, `plans/004-reconcile-permission-toggles.md`, `plans/005-check-presigned-upload-transaction.md`
- **Category**: dx
- **Planned at**: commit `b5402b7`, 2026-07-12

## Why this matters

The only app lint script always uses `--fix`, so a normal verification command mutates the working tree. A read-only lint run currently traverses 5.3 MB of vendored TinyMCE and reports 885 findings; even after excluding the vendor tree, first-party errors remain. The only existing GitHub workflow synchronizes package branches and never validates `apps/web`, allowing broken tests, types, lint, and builds to merge without a web-specific signal.

## Current state

```json
// apps/web/package.json:9-13
"test": "vitest run --environment jsdom --root src/",
"build-only": "vite build",
"type-check": "vue-tsc --noEmit -p tsconfig.vitest.json --composite false",
"lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path ../../.gitignore"
```

- `apps/web/.eslintrc.cjs` has no ignore patterns or overrides for file-routed component names and Node config files.
- A non-mutating run excluding vendored TinyMCE reports 57 first-party findings. Errors include missing Vue `v-for` keys in `Sidebar.vue`, `RailExpand.vue`, and `privacy-policy.route.vue`; Node globals in PostCSS/Tailwind configs; file-router/branding single-word component names; and an empty best-effort catch in `utils/services.ts`.
- Prettier and unused-variable warnings do not fail ESLint, but errors must reach zero before CI is enabled. Do not bulk-format unrelated files in this plan.
- `.github/workflows/sync-package-branches.yml` is package synchronization only; do not repurpose it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Lint check | `pnpm --filter @southneuhof/framework-web lint` | exit 0, no errors, no file modifications |
| Lint fix | `pnpm --filter @southneuhof/framework-web lint:fix` | exit 0 when explicitly invoked; not used in CI |
| Tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Workflow syntax | `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/web-validation.yml'); puts 'ok'"` | prints `ok` if Ruby is available |

## Scope

**In scope**:

- `apps/web/package.json`
- `apps/web/.eslintrc.cjs`
- `apps/web/postcss.config.js`
- `apps/web/tailwind.config.js`
- `apps/web/src/components/navigations/sidebar/rail/Sidebar.vue`
- `apps/web/src/components/navigations/sidebar/rail/layouts/RailExpand.vue`
- `apps/web/src/routes/(public)/privacy-policy/privacy-policy.route.vue`
- `apps/web/src/utils/services.ts` only for any remaining empty-catch lint error after plan 005
- `.github/workflows/web-validation.yml` (create)

**Out of scope**:

- Reformatting all 57 warning sites
- Editing vendored files under `apps/web/src/assets/lib/tinymce/`
- Deleting vendored TinyMCE; that is a separate deferred finding
- Changing application behavior beyond adding required stable `:key` values and comments in best-effort catch blocks
- Changing package-sync workflow behavior
- Adding pre-commit hooks or new lint dependencies

## Git workflow

- Suggested branch: `codex/plan-006-web-validation-gates`
- Suggested commit, if requested: `ci: validate web app changes`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Split read-only and fixing lint scripts

Change `apps/web/package.json` so:

- `lint` runs ESLint without `--fix` and is safe for CI;
- `lint:check` aliases the same non-mutating command if explicit naming is useful;
- `lint:fix` contains the former `--fix` behavior.

Do not change dependencies or the lockfile.

**Verify**: record `git status --short`, run `pnpm --filter @southneuhof/framework-web lint`, then compare status. The command may still fail on baseline errors at this step, but it must not modify files.

### Step 2: Configure intentional lint boundaries

Update `.eslintrc.cjs` to:

- ignore `src/assets/lib/tinymce/**` and generated/build directories;
- enable Node globals for `*.config.js` files;
- disable `vue/multi-word-component-names` only for file-router pages/layouts and established atomic branding/navigation component paths where filename conventions are intentional.

Do not disable `vue/require-v-for-key`, `vue/valid-v-for`, `no-undef`, or `no-empty` globally.

**Verify**: lint output contains no vendored TinyMCE paths, Node-global errors, or intentional file-route name errors.

### Step 3: Fix remaining first-party lint errors narrowly

- Add stable keys to every currently reported `v-for` in `Sidebar.vue`, `RailExpand.vue`, and `privacy-policy.route.vue`. Prefer domain IDs/names; use an index only when the rendered collection has no stable identity and cannot reorder.
- Resolve any remaining empty best-effort catch in `utils/services.ts` with a concise explanatory comment or explicit intentional handling.
- Do not run a repository-wide formatter. Leave non-failing warning cleanup for separate work.

**Verify**: `pnpm --filter @southneuhof/framework-web lint` -> exit 0. Immediately run `git diff --exit-code` against a status snapshot or inspect `git status --short` to prove lint did not mutate files.

### Step 4: Add the web validation workflow

Create `.github/workflows/web-validation.yml` with:

- pull-request and push triggers scoped to `apps/web/**` and direct source-alias dependencies (`packages/is-vue-framework/**`, `packages/utilities/**`, `packages/sdk/**`, `packages/contracts/**`, `packages/domain/**`, `apps/api/**`) plus workspace manifests/lockfile and the workflow itself;
- least-privilege `contents: read`;
- concurrency with cancellation for superseded branch/PR runs;
- checkout, Node version matching root engines, Corepack/pnpm 10.8.0, and `pnpm install --frozen-lockfile`;
- sequential gates for web lint, type-check, tests, and production build using the exact filtered commands above;
- pnpm/Turbo caching only through documented action options; do not add secrets.

Do not modify `sync-package-branches.yml`.

**Verify**: parse the YAML locally with the command above when Ruby is available. Also inspect that no `write` permission or secret reference exists: `rg -n "write|secrets\." .github/workflows/web-validation.yml` -> no matches.

### Step 5: Run the same gate locally

Run lint, type-check, tests, and build in the workflow's order.

**Verify**: all four commands exit 0. `git status --short` shows only intentional source/config/workflow changes and the plan index status.

## Test plan

No new application tests are required for stable template keys and lint configuration. The complete existing test suite is mandatory. Validate both lint modes: the default must be non-mutating, and `lint:fix -- --help` or command inspection must confirm the explicit fixer exists without running it across the workspace unnecessarily.

## Done criteria

- [ ] `lint` is non-mutating; `lint:fix` is explicit.
- [ ] Vendored TinyMCE and build/generated outputs are excluded from lint.
- [ ] Intentional file-router names are handled with narrow overrides, not a global rule shutdown.
- [ ] All first-party lint errors are resolved; warnings may remain.
- [ ] A least-privilege web workflow runs lint, type-check, tests, and build.
- [ ] Local lint, type-check, tests, and build all exit 0.
- [ ] No vendored file, lockfile, or package-sync workflow is changed.

## STOP conditions

Stop and report if:

- Achieving zero errors requires editing vendored TinyMCE.
- More than the listed first-party files have genuine lint errors after intentional overrides are applied.
- The web build cannot pass because of an unrelated baseline failure.
- CI requires credentials, deployment access, or write permissions.
- A verification command fails twice after a reasonable correction.

## Maintenance notes

New generated or vendored asset roots should be added deliberately to lint boundaries rather than suppressed file by file. Keep the default `lint` command read-only so Turbo and CI remain trustworthy. A later cleanup can reduce warnings, but it should not block this error-level gate.

