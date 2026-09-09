# Plan 001: Hide route type and build work inside Sprindle

## Status

- Priority: P1
- Effort: L
- Risk: HIGH
- Category: migration, developer tooling
- Planned at: `00763ed`, 2026-09-08
- Depends on: none
- Status: DONE

Work only in the current checkout. Do not inspect other branches or worktrees.
Do not commit, push, publish, or install an extension into the user's editor.
Before changes, run `git status --short` and compare the current code with the
excerpts below. Preserve unrelated work. If a required contract has changed,
revise this plan before implementation.

## Required result

A developer can add, move, or delete a route without knowing that generation
exists. The developer writes `+scope.ts` and `+server.ts`, imports helpers from
`@southneuhof/sprindle`, and runs normal project commands. No generated import,
type argument, route registration, or generator command is required.

The agreed tree uses ordinary path segments, `[id]` parameters, and `(group)`
directories that do not add URL segments. `+server.ts` exports HTTP methods.
`+scope.ts` exports `defineScope(...)` as default. It supplies shared context,
entity configuration, and hooks to descendants. Custom `defineRoute` accepts
neither a path nor a method. `list({})` and `detail({})` retain resource behavior.

Keep the current public runtime active while building internal tooling and
fixtures in this plan. Plan 002 changes runtime and app callers together.
Do not add public compatibility aliases or advertise two routing systems.

## Current state and evidence

- `apps/api/scripts/dev.ts:4` runs
  `spawn('tsx', ['watch', '--env-file-if-exists=.env', 'src/server.ts'], ...)`.
  It has no route compiler or editor integration.
- `apps/api/package.json` uses
  `tsc -p tsconfig.json --noEmit --singleThreaded` for build and type-check.
- `packages/sprindle/src/routes/define-route.ts:17` declares `method: TMethod`
  and `path?: TPath`. File routing must remove those fields in Plan 002.
- `packages/sprindle/docs/reference.md` says client types use Hono inference
  and no generator. The accepted file-routing requirement replaces that rule.
- `.vscode/extensions.json` has language recommendations but no Sprindle support.
- `turbo.json` assumes source-based type checks with no generated outputs.
- `plans/proofs/file-routing/language-core.mjs` supplies file-specific helper
  declarations through the TypeScript 7 native virtual filesystem. The 10
  checks in `language-proof.mjs` pass for completion, diagnostics, scope
  inheritance, unsaved changes, file changes, and ordinary package commands.
- The earlier 13 runtime checks pass. The last one confirms that a generated
  consumer alone does not type source callbacks. Do not use that failed design.

Read `plans/proofs/file-routing/LANGUAGE.md` before implementation. The proof
uses reduced helper declarations and an import scanner. Neither is ready for
production. Use real shared helper types and a parser with source mapping.

## Scope

In scope:

- New internal modules and tests under `packages/sprindle/src/tooling/`.
- New shared definition types under `packages/sprindle/src/routes/definition.ts`.
- Tool entry points and development dependencies in
  `packages/sprindle/package.json`; lockfile changes only for required tooling.
- An editor client under `packages/sprindle/editor/`, including an isolated
  extension-host test. Start with VS Code, for which this repo has configuration.
  Keep the service usable through LSP for other clients.
- Tooling documentation under `packages/sprindle/docs/` and this plan's status.

Out of scope: app route changes, database writes, table changes, Loom changes,
production deployment, extension marketplace publication, and user editor
settings. Project activation changes are integrated and checked in Plan 002.

## Commands

Existing commands, confirmed in this checkout:

```sh
node plans/proofs/file-routing/language-proof.mjs
apps/api/node_modules/.bin/tsx plans/proofs/file-routing/proof.ts
pnpm --filter @southneuhof/sprindle type-check
pnpm --filter @southneuhof/sprindle lint
pnpm --filter @southneuhof/sprindle test
```

The proof commands and Sprindle type-check passed during planning. Lint and
the full framework suite were not run during planning.

Add `test:tooling` and `test:editor` scripts to the Sprindle package for the
new integration gates. These are maintainer test commands, not generator
commands for app developers.

## Steps

### 1. Build one directory model

Add `src/tooling/route-files.ts` and `route-files.spec.ts`. Read recognized
files without executing application modules. Produce source path, HTTP path,
parameter names, method exports, and ancestor scope references. The same
result must drive runtime imports, virtual types, and API schema metadata.

Reject duplicate normalized method/path pairs, ambiguous parameter names,
duplicate parameter names in one path, unsupported segments, and invalid
reserved exports. Prefer static routes over dynamic ones. Ignore ordinary
helper and test files. Give both source paths for a collision. Use a parser
for exports; do not search source strings for method declarations.

Keep the grammar limited to the accepted forms. Add no optional parameters,
catch-all grammar, route reset syntax, or hidden resource endpoints.

Verify: `pnpm --filter @southneuhof/sprindle test -- src/tooling/route-files.spec.ts`
passes deterministic path, collision, ordering, and helper-file cases.

### 2. Build the shared type view

Add `src/tooling/language.ts` and `language.spec.ts`. Create virtual helper
declarations specific to each source file. Derive scope output from parent
scope types, resource records from Zod output, and parameters from the tree.
Do not copy the proof's reduced declaration signatures into production.
Place reusable generic contracts in `src/routes/definition.ts`; Plan 002
must use these same contracts at runtime.

Use an AST and source maps to redirect helper imports only inside the type
view. Support named imports, aliases, type imports, normal helper imports,
and incomplete editor buffers. Do not rewrite user files. Context from sibling
scopes must be absent. Child context fields replace matching parent fields
in both runtime semantics and types. Reserved framework dependencies must
not be replaceable through arbitrary returned context keys.

Use TypeScript's actual diagnostics and completion. Map diagnostics, hover,
definitions, rename, and suggested imports back to source. Internal helper
paths must not appear in these results. Infer custom output and resource
input/output without `any` or a union of all route contexts.

Keep native TypeScript API use in tooling. Pin the supported version; its
current entry point is unstable. The runtime must not load compiler code.

Verify: `pnpm --filter @southneuhof/sprindle test -- src/tooling/language.spec.ts`
passes positive and negative source typing, Zod input/output, completion,
mapping, unsaved scope changes, and parameter changes. Include a deliberate
wrong field that must cause a diagnostic; zero diagnostics alone is not proof.

### 3. Connect commands and the editor to that view

Add tooling command and language-server entry points. Batch checking and LSP
must share the directory model and type view. Preserve the app's ordinary
command names when Plan 002 connects them. The development runner must compile
before accepting requests and recover after a source error is fixed. It must
notice additions, edits, moves, deletions, and imported helper changes.

Route tree changes must invalidate compiler project roots. The proof needed
to reopen the compiler for this; retain that correct behavior until an
incremental reload has its own tests. Support request cancellation and close
compiler processes on server shutdown.

Use memory for language artifacts. Any runtime build artifacts belong in
ignored build output; no per-request scan. Generate the production route
manifest before packaging, so the deployed server does not require source
files or compiler dependencies. Write caches atomically and handle concurrent
build and test commands. Cache inputs include file names and compiler options,
so a move invalidates the result even if content is unchanged.

Verify: `pnpm --filter @southneuhof/sprindle test:tooling` passes command and
LSP integration tests against real child processes. Include cold start,
invalid source recovery, missing cache, concurrent commands, source-mapped
errors, and a production fixture with its source tree removed.

### 4. Verify editor activation before app migration

Build a small editor client that starts the service on a Sprindle project.
Use an isolated extension-host profile. Do not install into the user's profile.
The client is language support, with no generation commands or generated-file
UI. Do not rely on extension recommendations as proof of activation.

In the extension-host test, open a new fixture with no generated artifacts
and no dev server. Check completion, diagnostics, go-to-definition, and an
unsaved parent edit. Add, move, and delete a route. Check that the editor does
not require a restart, manual refresh, or generated type import. Ensure the
ordinary TypeScript service does not report conflicting diagnostics.

Record supported editor versions and the normal language-support installation
path. A desktop editor without this language support cannot acquire these
types from a manifest. Do not claim support for untested editors. If normal
project setup cannot activate the chosen integration, the app cutover remains
blocked; do not substitute a manual generator step.

Verify: `pnpm --filter @southneuhof/sprindle test:editor` exits 0, with the
extension-host evidence saved under ignored test output.

## Done criteria

- Both proof commands still pass.
- `test:tooling`, `test:editor`, type-check, lint, and framework tests pass.
- Source files remain byte-for-byte unchanged by language requests.
- No generated type imports, type parameters, or manual registration appear
  in the user fixture. No generator command appears in its setup instructions.
- Editor-host and batch diagnostics agree on invalid source locations.
- No compiler code enters the runtime package import graph.
- No app source changed. Update `plans/README.md` with test evidence.

Stop and report if the implementation needs per-route user annotations,
global context unions, silent unsafe types, edits to user files, or a manual
generation step. Do not lower the accepted requirement to complete this plan.

## Maintenance

Run the language and editor tests on every compiler upgrade. Review artifact
invalidation and source mappings when helper syntax changes. Treat the editor
and batch checker as two clients of the same type view.

## Accepted review limit

Context rename refuses the request without edits. Complete compiler references
are not available in the current integration. Safe refusal replaces the planned
rename support. Context inference, diagnostics, completion, and source file
add/move/delete checks pass. This does not require a generation step.
