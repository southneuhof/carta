# Plan 049: Align docs with owner list sources

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat aa30f1d..HEAD -- docs .agents/skills/build-resource-form AGENTS.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/048-bind-pts-to-owner-lists.md`
- **Category**: docs
- **Planned at**: commit `aa30f1d`, 2026-08-13

## Why this matters

The owner-list design is approved, but older docs still describe
`show-qhsse-pts`, a PTS-owned lookup dump, and `view-*` as data scope. The
next form implementer will copy those docs. This plan updates the current
sources of truth after the code change is real.

## Current state

Docs that still describe the old contract:

- `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md:346-408`
  lists `view-qhsse-pts` and `show-qhsse-pts` as PTS data permissions and
  says "the lookup response" can return mixed owner rows.
- `docs/architecture/rbac-parity-design.md:225-232` lists `lookup` as a
  separate server path and treats project `view-*` as data scope.
- `docs/architecture/web-application-architecture.md` still shows
  `permission: 'view-users'` on list/detail, which is correct for **admin
  routes**, but it does not say API list uses `list-*`.
- `.agents/skills/build-resource-form/SKILL.md` and
  `.agents/skills/build-resource-form/references/backend-form-contract.md`
  already ban a parent query schema and `/lookup`. They do not yet say
  "import the owner resource" or name `list-*` / `detail-*`.
- `docs/superpowers/specs/2026-08-13-owner-list-sources-design.md` is the
  locked design. After 046 it must already name `qhsse-pts-workflow`. Do
  not rewrite it. Only fix leftover contradictions.
- `docs/superpowers/specs/2026-08-13-permission-verb-convention-addendum.md`
  is later work. Leave it. Do not implement it here.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Old-code scan | `rg "show-qhsse-pts|create-options|/lookup" docs .agents/skills/build-resource-form` | no remaining instruction to build those paths |
| Diff check | `git diff --check` | no whitespace errors |

## Scope

**In scope**:

- `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`
- `docs/architecture/rbac-parity-design.md`
- `docs/architecture/web-application-architecture.md`
- `docs/superpowers/specs/2026-08-13-owner-list-sources-design.md` only for
  contradictions with shipped code
- `.agents/skills/build-resource-form/SKILL.md`
- `.agents/skills/build-resource-form/references/backend-form-contract.md`
- `docs/superpowers/specs/2026-08-12-resource-form-guideline-design.md` if
  it still tells the skill to invent consumer option routes

**Out of scope**:

- Application code
- The addendum implementation
- Historical plan files under `plans/041-045`
- `docs/current-administration-form-inventory.md` unless a sentence now
  tells an implementer to use `/lookup`

## Git workflow

- Commit message style: `docs: align owner list and permission verbs`
- Do NOT push or open a PR unless asked

## Steps

### Step 1: Fix the PTS parity spec

In `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`:

- Authorization list: `view-qhsse-pts` is menu only. Add `list-qhsse-pts`
  and `detail-qhsse-pts`. Remove `show-qhsse-pts`.
- Say list returns reports on any assigned project (`coveredProjectIds`).
  Detail outside assignment is `404`.
- Replace the "lookup response" paragraph. PTS does not own a lookup
  endpoint. Fields call owner `list` / `detail` with the searchParameters
  from the owner-list spec.
- Point readers to
  `docs/superpowers/specs/2026-08-13-owner-list-sources-design.md`.

**Verify**: `rg "show-qhsse-pts|lookup response" docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`
→ no matches that describe a PTS-owned lookup

### Step 2: Fix RBAC and web architecture

In `docs/architecture/rbac-parity-design.md`:

- Resource scope: remove `lookup` as a separate path. Lists, details,
  actions, counts, searches, and exports use the same coverage.
- State the verb rule in one short table: system `view` / `list` /
  `detail` / owner writes; project workflow writes; default coverage is
  any assignment.
- Keep "there is no `access-all-projects` bridge".
- `/me` still returns system permissions only.

In `docs/architecture/web-application-architecture.md`:

- Keep resource action `permission` as the admin route guard (`view-*`).
- Add one sentence: a lookup `source` is another resource's `list` /
  `detail`. The API gates those calls with `list-*` / `detail-*`.

**Verify**: `rg "lookup" docs/architecture/rbac-parity-design.md` → no
bullet that lists lookup as its own server operation

### Step 3: Update the form skill

In `.agents/skills/build-resource-form/SKILL.md` and
`references/backend-form-contract.md`:

- Add: import the owner resource. Do not add
  `/<consumer>/create-options/*`.
- Add: pass `searchParameters`; do not redeclare the owner query.
- Add: API list/detail use `list-*` / `detail-*`. Resource `permission`
  stays `view-*` for the admin screen.
- Keep the existing query-ownership section.

Do not mention `/lookup` except as a forbidden pattern.

**Verify**: `rg "create-options" .agents/skills/build-resource-form` → only
a prohibition, if present
`git diff --check` → clean

## Test plan

No runtime tests. This is a docs-only plan.

Scan:
`rg "show-qhsse-pts|qhsse-pts/create-options" docs .agents`
→ no remaining instruction to implement those symbols

## Done criteria

- [ ] PTS parity spec no longer lists `show-qhsse-pts`
- [ ] RBAC spec no longer treats lookup as a separate path
- [ ] Form skill says to import the owner resource
- [ ] `git diff --check` is clean
- [ ] No application code changed
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 048 is not DONE, so the docs would describe code that is not
  shipped.
- Updating a doc would require changing a locked product rule (for
  example adding `access-project` or `/me.projectViews`).
- The form skill change appears to need a framework API change.

## Maintenance notes

- Reviewers should read the three current sources together: owner-list
  spec, RBAC spec, form skill.
- Plan 050 implements the remaining catalog. Do not start it from this
  docs pass.
