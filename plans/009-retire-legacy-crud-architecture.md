# Plan 009: Retire the legacy CRUD architecture and publish migration guidance

> **Implementation instructions**: Begin only after every in-repo route has zero legacy usage and plans 007-008 are stable. Separate application cleanup from public-package API removal. Removing exported APIs requires an explicit major-version decision; otherwise retain deprecated compatibility wrappers for one release.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- packages/is-vue-framework/src apps/web/src apps/web/README.md docs package.json pnpm-lock.yaml .github/workflows plans`; verify architecture hash `6fbc44a012d92c4462e08914ca75b5b4226845c8` or review intentional documentation changes made by prior plans.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/007-migrate-roles-as-nested-slice.md`, `plans/008-migrate-users-and-prove-complexity.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

The migration is incomplete while the app can still fall back to query-driven `CRUDComposite` orchestration and duplicated vocabulary. Cleanup must be evidence-driven because `@southneuhof/is-vue-framework` is a published package: in-repo deletion and public export removal have different compatibility risks. This phase establishes zero-use gates, deprecation/removal policy, documentation, and release validation.

## Current state

- `packages/is-vue-framework/src/components/CRUD/CRUDComposite.vue:36-97` selects screens from query state and forwards many slots.
- `CRUDList.vue`, `CRUDDetail.vue`, `CRUDCreate.vue`, and `CRUDUpdate.vue` combine resource operation resolution with visual chrome.
- `packages/is-vue-framework/src/adapters/crudOperations.ts` and `runtime.ts` expose legacy operation vocabularies.
- `packages/is-vue-framework/package.json` reports version `1.0.10`; removing exports may break consumers outside this monorepo.
- The architecture document contains the target rules, a migration outline, and a 2026-07-26 Addendum recording later design decisions (prop factories, `behavior` block, vocabulary rules, HTML5 history, clean break); its previously garbled cache-key sample was fixed on 2026-07-26. The final document must match the shipped API.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Legacy scan | `rg "CRUDComposite|CRUDList|CRUDDetail|CRUDCreate|CRUDUpdate|resolveCRUDOperations|FrameworkCRUDRuntime|fieldsProxy|_view" apps/web/src packages/is-vue-framework/src` | only approved compatibility/deprecation files and tests |
| All tests | `pnpm -r --filter '!./apps/base-mobile' test` | exit 0 for packages with tests |
| All types | `pnpm -r --filter '!./apps/base-mobile' type-check` | exit 0 for packages with type-check |

`apps/base-mobile` is excluded from the recursive gates: it is deliberately outside this migration and currently imports the nonexistent package `@southneuhof/is-data-model`, so it cannot type-check regardless of this plan's changes. Do not fix it here.
| Web build/lint | `pnpm --filter @southneuhof/framework-web build && pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Framework package | `pnpm --filter @southneuhof/is-vue-framework build` | exit 0 |
| Graph | `graphify update .` | exit 0; graph updated |

## Scope

**In scope**:

- legacy framework components, adapters, model-config exports, and compatibility tests
- all in-repo web imports/config leftovers
- `packages/is-vue-framework/package.json` exports/version metadata only under approved release policy
- architecture/migration/reference docs and app/framework READMEs
- CI validation covering framework and migrated web paths
- `graphify-out/` only through `graphify update .`

**Out of scope**:

- Migrating external HKA-TROM or any downstream repository
- Removing public APIs without consumer evidence and a major-version/deprecation decision
- Changing backend authorization/response contracts
- Broad unrelated dependency or UI cleanup

## Git workflow

- Suggested branch: `codex/plan-009-retire-legacy-crud`
- Suggested commits: `refactor(web): remove legacy CRUD usage`, then `docs(framework): publish resource migration guide`; use a separate breaking-change commit only if explicitly approved.
- Do not push, publish, or open a PR unless instructed.

## Steps

### Step 1: Prove zero active in-repo usage

Run the legacy scan and classify every match as active production use, compatibility implementation, test, or documentation. Remove active app use and stale configs only. Add a CI/static test that prevents new app imports of legacy CRUD/model-config paths.

**Verify**: the scan contains no active `apps/web/src` usage; static boundary test passes.

### Step 2: Verify the no-consumer assumption, then apply the clean-break policy

Policy decided 2026-07-26: `@southneuhof/is-vue-framework` has no consumers outside this monorepo, so legacy exports are removed outright with a major version bump — no deprecation cycle, no wrappers. Before deleting, verify the assumption: check the npm registry for published versions and the external repository URL for dependents; the package's src-pointing `exports` and missing `publishConfig` suggest it was never truly publishable. If a real external consumer surfaces, STOP and re-decide.

**Verify**: the verification result and major-version decision are recorded in release notes/changeset; package API tests assert exactly the intended new-surface exports.

### Step 3: Delete legacy code wholesale

Delete legacy components (`CRUDComposite`, `CRUDList`, `CRUDDetail`, `CRUDCreate`, `CRUDUpdate`, legacy Table/Detail/Form and `Legacy`-prefixed aliases), the CRUD runtime/model-config exports, and their obsolete tests; remove now-unused dependencies/imports. There are no compatibility converters to collapse — none were built.

**Verify**: legacy scan returns no matches outside the migration guide's historical examples; framework build/tests/types pass.

### Step 4: Reconcile architecture and write the migration guide

Update `docs/architecture/web-application-architecture.md` to the exact shipped API: fold the 2026-07-26 Addendum's decisions into the body (factory call signatures, `behavior`, `renderer`/`namespace` vocabulary, HTML5 history), correct invalid/stale examples, and remove the Addendum once the body matches. Add a migration guide mapping:

- CRUDComposite query states to filesystem route files;
- CRUDList/Detail/Create/Update to shells + core bindings;
- legacy config maps/aliases/proxies to field catalogs/read hooks;
- repeated RPC operations to the project resource factory;
- fake nested CRUD to parent route context + explicit workflows;
- advanced query/load/schema/control escape hatches.

Include complete minimal and nested examples based on the migrated roles/users code, not hypothetical APIs.

**Verify**: every referenced import/path resolves; fenced TypeScript/Vue examples pass an extraction/type-check script or are copied from compiled fixtures.

### Step 5: Harden CI and run release validation

Extend validation paths to cover framework, app adapters, route generation, contract/type tests, production web build, and the legacy import boundary. Run the full command table from a clean frozen install. Update graphify after code/document changes.

**Verify**: all commands exit 0, `git status --short` contains only intended files, and graph query for CRUD architecture surfaces the new resources/cores/shells rather than `CRUDComposite` as the active center.

### Step 6: Prepare downstream migration without editing downstream code

Create a concise downstream checklist for HKA-TROM: inventory its resources/routes/custom workflows, select one nested vertical slice, map backend adapters, run the acceptance matrix, and preserve URL redirects. Do not claim downstream compatibility until executed in that repository.

**Verify**: checklist explicitly separates framework readiness from downstream migration status.

## Test plan

- Package export/API tests for selected compatibility policy.
- Static import boundary forbidding new app legacy usage.
- Full roles/users regression and route tests.
- Documentation example compilation.
- Clean-install full monorepo validation and production build.

## Done criteria

- [ ] No active in-repo route uses legacy CRUD orchestration/config.
- [ ] Public API removal or deprecation has explicit approved release policy.
- [ ] Architecture doc and migration guide match compiling examples.
- [ ] CI prevents regression to legacy imports.
- [ ] Full monorepo/framework/web validation and graph update pass.
- [ ] Downstream work is documented but not falsely marked migrated.
- [ ] Index row is `DONE`.

## STOP conditions

- Any active in-repo consumer remains on legacy APIs.
- Public consumer impact cannot be determined or major removal is not explicitly approved.
- Documentation examples do not compile against the shipped surface.
- Clean-install validation fails twice or requires unrelated broad changes.

## Maintenance notes

The non-breaking and major-removal paths are intentionally distinct. Reviewers must reject a PR that quietly deletes published exports while labeling the change as internal cleanup.
