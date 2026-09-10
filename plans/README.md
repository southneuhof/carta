# File-routing plans

Planned with the improve skill against checkout `00763ed` on 2026-09-08.
Both plans passed parent review on 2026-09-09.

## Status

| Plan | Priority | Depends on | Status |
| --- | --- | --- | --- |
| [001: Hidden tooling and editor support](001-hide-route-language-and-build-work.md) | P1 | None | DONE |
| [002: Framework and app migration](002-migrate-sprindle-and-carta-file-routes.md) | P1 | 001 | DONE |
| [003: Reject route import cycles](003-reject-route-import-cycles.md) | P1 | None | DONE |
| [004: Preserve external declaration paths](004-preserve-external-declaration-paths.md) | P1 | 003 | DONE |

## Delivered contract

HTTP methods and paths come from `+server.ts` files and named method exports.
Parent `+scope.ts` files supply context, identity, access checks, entities, and
record conversion. Parent hooks receive their own context and identity. Child
context can replace fields for descendants without changing parent checks.

Developers can add, move, or delete routes without a registration edit,
generated import, manual context type, or generation command. The normal build,
type-check, test, and development commands maintain private artifacts. The SDK
uses declarations emitted from the same contextual type view as the editor.
Type-only changes update those declarations. Plain consumer TypeScript checks
work after application route source is removed.

All 27 existing API method/path pairs are preserved. Database domain ownership
is separate from route ownership. Production runs in plain Node from a shared
ESM bundle. Development and tests use separate source manifests, so app request
state is shared and simultaneous build/test commands do not replace each
other's artifacts. No production request scans source files or loads a compiler.

## Parent verification

The parent ran these checks against the final implementation:

- `pnpm build --force`: six tasks passed, zero cache hits.
- `pnpm type-check --force`: six tasks passed, zero cache hits.
- `pnpm lint --force`: three tasks passed, zero cache hits.
- `pnpm test --force`: twelve tasks passed, zero cache hits. The unrestricted
  Sprindle suite has 184 tests; API has 72, SDK has 3, and web has 216.
- `pnpm test:module-tooling`: 47 tests passed.
- Sprindle isolated VS Code editor-host and editor-install tests: exit 0.
- [Language proof](proofs/file-routing/LANGUAGE.md): ten checks passed.
- [Runtime proof](proofs/file-routing/README.md): thirteen checks passed,
  including the counterexample for manifest-only source type inference.
- Cold normal development startup: HTTP asset URL projection, route addition,
  invalid-edit recovery, route move, and route deletion passed.
- Cached build and type-check after output removal: six cache hits each;
  required binaries, declarations, and API artifacts were restored. The SDK
  consumer check passed after each restoration.
- Direct plain Node import of the production application returned 200 from
  `/health`. The isolated production test runs a copied bundle without app
  source, the Sprindle package, or a TypeScript loader.
- `git diff --check` and the obsolete production registration search passed.

The API test target guard reported `VALID` for the separate `carta_test`
database before migrations and tests. The existing ignored `.env.test` was
missing its purpose and name markers; those two markers were added. Database
credentials and the target URL were not changed.

Earlier review failures were corrected before approval. The full framework
suite is enabled. Tests cover parent rejection and error unwinding, middleware,
parsed write hooks, type and runtime inheritance, declaration publication from
concurrent processes, failed-build preservation, path aliases, exact literal
outputs, type-only edits, and production/development request state.

## Editor setup and limits

Run `pnpm setup:editor` once to install the project language support. No route
generation command is needed. The parent tested installation in an isolated
profile; the user's editor profile was not changed.

VS Code 1.136.1 on macOS is the tested editor. The extension supports one
TypeScript project at a time. Context rename refuses edits because complete
cross-file references cannot yet be proved. Source add, move, and delete,
context inference, diagnostics, completion, and definitions are supported.
See [tooling documentation](../packages/sprindle/docs/file-routing-tooling.md).

## Boundaries

Work stayed in the current checkout. No other branch, worktree, or historical
implementation was inspected. No commit, push, publication, deployment,
application schema migration, or development database reset was performed.

## Follow-up plan 003

Plan 003 was written with the improve skill at `83c0cf9` on 2026-09-10.
It is independent of other pending module work. It preserves the completed

The bundle contains the reported undefined auth domain. A focused check also
found that native ESM fails when the same graph is loaded through the scope
first. The plan therefore breaks the application cycle and rejects static
local import cycles before publication. It also gives E2E its own source
manifest so application modules are shared.

Considered and rejected: treating the graph as safe for every ESM entry order;
waiting for route readiness; skipping undefined domains; changing import order
to hide the fault; and adding a new compiled-module system for this fix.

Planning checks: six existing Sprindle manifest tests passed. The minimal
in-memory reproduction confirmed both the native ESM initialization error and
the delayed bundle error. No database reset, live HTTP check, or browser E2E
was run. This was not a full framework or repository audit.

Final review of plan 003 passed on 2026-09-10. The standard Sprindle tooling
suite passed all 37 tests after the timeout and process-cleanup correction.
The API build and all 4 selected API tests passed. Type-check, lint, and patch
checks passed. Browser E2E was not run. See the plan for the full evidence,
earlier failures, and the separate external declaration-emission limit.

## Follow-up plan 004

The user selected the existing temporary-folder approach on 2026-09-10 to get
sibling source imports working quickly. Plan 004 keeps the TypeScript CLI and
maps discovered source and declaration files relative to a common ancestor.
It depends on the completed but uncommitted plan 003 changes.

The virtual-emitter alternative is deferred. The installed TypeScript 7.0.2
public emitter exposes `printNode`; declaration emission through that API was
not proved. The implementation must establish the sibling-import regression
and portable consumer proof before completion. No new compiler architecture,
application configuration, or user generation command is planned.
