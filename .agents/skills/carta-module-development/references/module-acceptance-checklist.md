# Module acceptance matrix

Copy the applicable rows into `plans/<feature>/worksheet.md`. Each numbered
plan names the rows it owns. Mark a row `NOT NEEDED` with a reason.

## Contract and continuity

- [ ] The artifact ledger identifies the strongest usable input and approval.
- [ ] The approved design owns every material product and architecture decision.
- [ ] The plan does not silently change the design.
- [ ] Partial implementation keeps current passing evidence and resumes the
      first incomplete, stale, or failed item.
- [ ] Each plan has one observable vertical result and explicit dependencies.

## Database and API

- [ ] Schema, migration, relation, seed, and delete behavior match the design.
- [ ] Request, response, service, and persistence fields align.
- [ ] Permissions match the approved matrix in catalog, guards, seed, and tests.
- [ ] Standard and custom actions use `$api-conventions`.
- [ ] Focused API tests cover each changed contract and business failure.
- [ ] Migration and seed evidence names the target environment.

## Web

- [ ] Routes, navigation, actions, labels, and visible states match the design.
- [ ] Standard surfaces use `$web-ui-surfaces`; forms use
      `$build-resource-form` when applicable.
- [ ] Field types and conversions follow `frontend-field-contract.md`.
- [ ] Server reads and invalidation follow `web-query-cache.md`.
- [ ] Accessibility basics and permission-visible states are present.
- [ ] Focused web tests cover changed route and resource contracts.

## User journey

- [ ] Every planned route and action has a named journey step or a recorded
      reason that UI evidence is not applicable.
- [ ] Writes occur through the visible authenticated UI.
- [ ] A fresh focused Playwright report was made after the last in-scope change.
- [ ] Reload or navigation proves the persisted visible result.

## Evidence and review

- [ ] The plan records changed files, exact commands, results, and report paths.
- [ ] Failed checks and stale evidence remain visible.
- [ ] All owned rows pass before the plan enters `VERIFY`.
- [ ] An independent read-only reviewer checks the full database-to-UI path when
      delegation is available.
- [ ] No required work remains before `DONE`.
