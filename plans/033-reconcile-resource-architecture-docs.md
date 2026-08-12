# Plan 033: Reconcile resource architecture documentation and final gates

> **Implementation instructions**: Document only the shipped API after plan 032. Remove old examples instead of adding a migration addendum.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- docs/architecture/web-application-architecture.md docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md packages/is-vue-framework/README.md .agents/skills/migrate-web-resource apps/web/src/framework/__tests__`

## Status

- **Status**: DONE
- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/032-remove-legacy-resource-apis.md`
- **Category**: docs
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

The current architecture document describes `table()`, `detail()`, `form()`, capabilities, the framework Hono entry, and a shared field catalog. After migration, those examples would direct maintainers to deleted APIs. The final documentation must describe the only shipped path and the boundary tests must enforce it.

## Current state

- `docs/architecture/web-application-architecture.md:140-177` describes shared field catalogs and framework-owned Hono operations.
- Lines 219-237 document `table`, `detail`, and `form` factories.
- Lines 302-314 show Views receiving whole resource objects.
- `packages/is-vue-framework/README.md:23-47` describes field catalogs and old resource ownership.
- The approved design spec is the target decision record and must remain consistent with implementation.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Old docs scan | `rg -n "createHonoResourceOperations|defineResourceOperations|defineFields|\.table\(|\.form\(|:resource=|capabilities:|schemas:" docs/architecture/web-application-architecture.md packages/is-vue-framework/README.md .agents/skills/migrate-web-resource` | no obsolete API examples |
| Boundary test | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts framework/__tests__/entity-schema-import.spec.ts` | exit 0 |
| Framework public API | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/__tests__/public-api.spec.ts` | exit 0 |
| Full checks | `pnpm test && pnpm type-check && pnpm build` | exit 0 or only separately recorded pre-existing failure |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `docs/architecture/web-application-architecture.md`
- `docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md` status and implementation notes only
- `packages/is-vue-framework/README.md`
- `.agents/skills/migrate-web-resource/SKILL.md` only if shipped names differ from its approved instructions
- Final framework/web public and boundary tests

**Out of scope**:

- New architecture decisions
- Compatibility or migration guides
- API/backend documentation
- Feature or UI changes

## Git workflow

- Branch: `codex/033-resource-architecture-docs`
- Commit: `docs: reconcile resource architecture`
- Do not push or open a pull request unless asked.

## Steps

1. Rewrite the resource section around `defineSchema`, `defineResource(schema, { actions })`, complete per-action fields, standard `run`, and plain custom actions.
2. Replace View examples with `v-bind="resource.list()"`, `detail({ id })`, `create()`, and `update({ id })`.
3. Document app-owned Hono adaptation and direct service/fetch functions. State that framework core has no Hono contract.
4. Document route ownership of confirmation, dialogs, toast, navigation, and multi-resource workflow.
5. Reconcile the migration skill only for actual shipped names. Do not broaden its scope.
6. Run the final scans and full verification commands.

## Test plan

The boundary and public API tests are the executable documentation. They must reject old resource files, old operation files, framework Hono imports, old View bindings, and deleted public exports.

## Done criteria

- [ ] Architecture and package docs show only the shipped API.
- [ ] Approved design and implementation names match.
- [ ] Migration skill matches the shipped API and cohort execution rule.
- [ ] Old documentation scan has no obsolete examples.
- [ ] Public and boundary tests pass.
- [ ] Full repository checks have no new failure.

## STOP conditions

- Stop if implementation differs materially from the approved design; report the difference before rewriting the decision record.
- Stop if a documented old API still exists in source.
- Stop if final checks reveal an incomplete module migration.

## Maintenance notes

Keep the architecture document current by editing the main sections. Do not accumulate addenda for deleted APIs.
