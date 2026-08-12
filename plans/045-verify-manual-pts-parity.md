# Plan 045: Verify manual PTS parity and remove draft residue

> **Implementation instructions**: This is the final acceptance pass, not a
> place to finish planned features. Run the static checks first, then focused and
> full suites, then real browser flows. Fix only confirmed defects inside the
> approved slice. A business-rule difference is a STOP condition for user
> review. When implementation and review are complete, update this plan row in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1b8ae46..HEAD -- packages/is-vue-framework apps/api/src/routes/qhsse-pts apps/api/src/authorization/catalog.ts apps/web/src/routes/'(authenticated)'/quality/pts docs`
> Plans 040-044 are expected to change these paths. Confirm that all five plans
> are DONE and use the live code as the baseline. Any unrelated material change
> is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans 040, 041, 042, 043, and 044
- **Category**: tests
- **Planned at**: commit `1b8ae46`, 2026-08-12

## Why this matters

Passing isolated tests does not prove business parity. The full slice crosses
the framework collection lifecycle, database transactions, project
authorization, workflow actions, notifications, activity, and browser refresh.
This plan proves the approved manual paths end to end and removes only confirmed
residue from the replaced draft.

## Current state

- The accepted design is
  `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`.
- Legacy business evidence remains in
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Services/QhssePts/`,
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/QhssePts.php`,
  and
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/qhsse-pts/`.
  Use it only to compare visible behavior that the approved design retains.
- Plans 040-044 must already provide framework, API, list/editor, and detail
  behavior. This plan may correct defects found by verification, but it must not
  introduce a new design.
- Deferred behavior remains Consultant/Contractor exceptions, Quality
  Inspection, historical import, and closed-report PDF/print.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Draft scan | commands in Step 1 | no forbidden matches |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework test:browser` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Root type check | `pnpm type-check` | exit 0 |
| Root lint | `pnpm lint` | exit 0 |
| Root build | `pnpm build` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Use `web-ui-surface-reuse` to audit the final UI and write the required reuse
  record.
- Use `code-refactor-review` only on the final diff to find duplicated or
  inconsistent code. Do not accept unrelated cleanup.
- Use `ponytail-review` to find abstractions or compatibility code that this
  slice does not need.
- Use the in-app browser for real interface verification.

## Scope

**In scope**:

- Defect corrections within files changed by plans 040-044.
- Focused PTS tests and collection-presentation tests changed by plans 040-044.
- `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md` only if an
  objective wording error is found; any business decision change is a STOP.
- `plans/README.md` status updates.

**Out of scope**:

- New features, new framework surfaces, and broad refactors.
- Changes to unrelated modules or shared authorization behavior.
- Quality Inspection, role exceptions, import, and print/PDF.
- Backward compatibility with the replaced API draft or removed web module.
- Visual redesign beyond correcting a proven legacy-parity difference.

## Git workflow

- Suggested branch: `codex/045-verify-pts-parity`.
- Suggested commit, only if fixes are needed: `fix(pts): close parity gaps`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Run residue and architecture scans

Run these searches and inspect every match:

```sh
rg -n "complete-analysis|verification\b|analysis\b|implementation\b|closed\b" apps/api/src/routes/qhsse-pts apps/web/src/routes/'(authenticated)'/quality/pts
rg -n "['\"]disposition-qhsse-pts['\"]" apps/api/src apps/web/src
rg -n "quality.?inspection|consultant|contractor|roleId|roleCode|source|rejectedNotes|ptsNotes" apps/api/src/routes/qhsse-pts apps/web/src/routes/'(authenticated)'/quality/pts
rg -n "method: ['\"]delete['\"]|\.delete\(qhssePts\)|delete from qhsse_pts" apps/api/src/routes/qhsse-pts
rg -n "useLoader|useNamespacedQuery|fetch\(" apps/web/src/routes/'(authenticated)'/quality/pts
```

Expected result:

- no old action/state as a stored business value;
- no exact generic disposition permission;
- no deferred QI, role exception, or removed draft field;
- no hard-delete route/query;
- no route-owned list loader or query lifecycle.

Words such as "implementation" can be valid approved field/action names. Each
match must be judged against the approved exact values; do not delete valid
terms to make a search empty.

**Verify**:
record the inspected matches and confirm no forbidden use remains.

### Step 2: Audit the framework collection gate

Verify:

- `Table` normal calls still pass;
- `ListView` table and custom modes share one collection;
- presentation switch retains records and query with no load;
- search, filters, sort, page, limit, refresh, loading, empty, and error states
  work in both modes;
- custom slot types have no loader;
- custom mode without its slot fails clearly in development.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework test`
- `pnpm --filter @southneuhof/is-vue-framework test:browser`
- `pnpm --filter @southneuhof/is-vue-framework type-check`

All commands must exit 0.

### Step 3: Run API domain acceptance

Run the focused PTS suite and inspect its case names. It must cover:

- create relation checks, at least one root cause, and unique numbering;
- direct approved closure;
- light, medium, and heavy branches;
- follow-up in both orders;
- selected implementation user;
- complete proof images;
- rejection and full resubmission;
- approval, realization, and close;
- reason-based soft delete, including closed records;
- low/high disposition permissions;
- project scope and notification recipients;
- transaction rollback and concurrent action rejection.

Then run the full API suite. Correct only confirmed PTS defects.

**Verify**:

- `pnpm --filter @southneuhof/api test -- qhsse-pts.spec.ts`
- `pnpm --filter @southneuhof/api test`
- `pnpm --filter @southneuhof/api type-check`

All commands must exit 0.

### Step 4: Run web route acceptance

The focused PTS web suite must cover create/edit fields and dependent lookups,
tabs and filters, table/grid switch, card/table parity, action dialogs, complete
proof, delete reason, and success/failure refresh behavior. Then run the full web
suite and type check.

**Verify**:

- `pnpm --filter @southneuhof/framework-web test -- pts`
- `pnpm --filter @southneuhof/framework-web test`
- `pnpm --filter @southneuhof/framework-web type-check`

All commands must exit 0.

### Step 5: Run full real-browser business flows

Use disposable test data and complete these paths in the real interface:

1. approved disposition from a new report to direct close;
2. light non-approved path to close;
3. medium non-approved path to close;
4. heavy non-approved path through temporary plan and management notes to close;
5. one path with implementation then price follow-up;
6. one path with price then implementation follow-up;
7. one rejected verification, complete replacement report, approval,
   realization, and close;
8. reason-based soft delete of one open and one closed report.

At every action, verify visible step/status, available controls, activity,
intended notification recipients, and no manual page reload. Verify a user
outside project scope gets not found and a covered user without action
permission gets forbidden.

**Verify**:
record a compact pass/fail checklist with report numbers and test user roles or
permissions. Do not record secret values.

### Step 6: Compare retained visible parity with legacy

Compare the new list table, PTS card, create/edit form, detail section order,
field labels, action labels, and branch sequence with the approved spec and the
legacy source paths. The approved design wins where it explicitly changed or
deferred legacy behavior. Do not restore:

- Consultant/Contractor branches;
- Quality Inspection entry;
- old date/source fields;
- partial implementation report;
- historical import;
- closed-report PDF/print.

Any other business difference needs user approval before correction.

**Verify**:
produce a parity checklist that marks each approved visible requirement PASS or
STOP. Do not use subjective style scores.

### Step 7: Review the final diff and reuse record

Review all changes from plans 040-044 for:

- duplicate state or permission rules in web code;
- a second loader/query lifecycle;
- generic workflow/card/dialog abstractions with one consumer;
- compatibility fields or adapters;
- out-of-scope test scaffolding;
- missing transaction, validation, error, security, or accessibility behavior.

The handoff must state:

- **Reused**: `ListView`, `Table`, `FormView`, `Form`, `Detail`, `DialogForm`,
  `Tabs`, `Card`, `Chip`, `ImagePreview`, `Timeline`, `ConfirmationDialog`, and
  the actual renderers used;
- **Searched**: exact framework component/renderer paths and app exemplars;
- **Gap**: the one-loader custom collection presentation closed by plan 040;
  no other framework gap is approved.

**Verify**:
`git diff --check` has no output and `git status --short` contains no unrelated
files.

### Step 8: Run the repository gate

**Verify**:

- `pnpm type-check`
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

All commands must exit 0. If an unrelated pre-existing failure appears, capture
the exact command and failure and stop; do not weaken or skip the gate silently.

## Test plan

This plan adds a test only when a confirmed acceptance defect lacks a stable
regression check. Add the smallest domain or route test that fails before the
fix. Do not add duplicate tests for behavior already covered by plans 040-044.
Real-browser flow evidence is required even when all automated checks pass.

## Done criteria

- [ ] No forbidden draft, compatibility, QI, or role-exception residue remains.
- [ ] Framework one-loader presentation contract passes all checks.
- [ ] API focused and full suites pass.
- [ ] Web focused and full suites pass.
- [ ] Direct close, light, medium, heavy, both follow-up orders, rejection loop,
  and open/closed soft delete pass in the real browser.
- [ ] List, card, form, detail, labels, actions, activity, and notifications match
  the approved design.
- [ ] No successful form needs a page reload.
- [ ] Root type check, test, lint, build, and diff check pass.
- [ ] Final Reused, Searched, and Gap record is complete.
- [ ] No unrelated file changed.

## STOP conditions

Stop and report if:

- a found difference changes an approved business rule;
- a fix needs a new framework surface, shared authorization change, or schema
  migration;
- legacy behavior conflicts with the approved design;
- a deferred role, Quality Inspection, import, or PDF decision is required;
- test data cannot be isolated from shared or production data;
- a verification command fails twice after a reasonable correction; or
- the full repository gate has an unrelated pre-existing failure.

## Maintenance notes

Keep the parity checklist with the implementation handoff or pull request. The
next slice must start with a new approved design for role exceptions, Quality
Inspection, import, or print. Do not treat this acceptance plan as standing
permission to add them.
