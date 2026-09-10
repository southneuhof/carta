# Plan 004: Emit route declarations with sibling source imports

> Implement this plan in order. Keep the current compiler and temporary-file
> workflow. Run the checks below and preserve unrelated work. Mark DONE only
> after implementation and review.
>
> Drift check: `git diff --stat 83c0cf9..HEAD -- packages/sprindle/src/tooling/manifest.ts packages/sprindle/src/tooling/manifest.spec.ts packages/sprindle/src/tooling/tooling.spec.ts packages/sprindle/docs/file-routing-tooling.md`
> Also read the working diff: plan 003 is complete but remains uncommitted.

## Status

- Status: DONE
- Priority: P1
- Category: bug
- Effort: M — a bounded change to declaration paths and regression tests
- Risk: MED — incorrect output paths can break all consumer declarations
- Depends on: plan 003, DONE in this working tree
- Planned at: `83c0cf9`, 2026-09-10, with existing local changes
- Authority: The user selected the temporary-folder approach to get the fix
  working quickly. Broader developer-experience work is deferred.

## Why this approach

Keep the existing TypeScript CLI declaration compiler. Copy the discovered
source files into one private temporary tree that preserves their relative
locations. This needs fewer changes than replacing the compiler integration.

The installed TypeScript 7.0.2 public API has virtual filesystem reads, but its
`Emitter` exposes only `printNode` in both its declaration and implementation.
A declaration-emission API was not proved. Do not add private protocol calls,
a compiler upgrade, or a custom declaration printer for this fix.

Normal build, test, and development entry points stay unchanged. No new user
command, application configuration, or symlink workaround is required. This
plan does not add a general diagnostic-remapping or compiler architecture project.

## Current state and evidence

`packages/sprindle/src/tooling/manifest.ts:78` owns `emitRouteDeclarations`.
`routeLanguageOverlay` already discovers direct relative dependencies outside
`projectRoot`; `sourceDependencies` in `language.ts:46` follows those imports.
The declaration copy loop then discards the discovered external files:

```ts
const path = relative(projectRoot, file)
if (path.startsWith('..') || path === 'tsconfig.json') continue
const output = resolve(input, path)
```

At `manifest.ts:115`, the compiler input list still includes those files:

```ts
const contextualSources = [...overlay.keys()].filter(/* TypeScript sources */)
const rootFiles = [/* routes, scopes, contextualSources, virtualDefinition */]
  .map((file) => resolve(input, relative(projectRoot, file)))
```

An import such as `../../../shared/result` from
`workspace/api/routes/health/+server.ts` therefore resolves to an uncopied
file outside the temporary project. The prior review observed TS6053.
Simply removing the skip would allow writes outside the owned temporary root.

Other coupled locations in the same file:

- Lines 95–102: dependency links used by the temporary compiler.
- Lines 105–118: effective configuration, aliases, `rootDir`, and compiler entry.
- Lines 120–129: generated helper copies and declaration import rewriting.
- Lines 135–138: route references in the published `RouteContract`.
- `rewritePathAliases`: maps original alias targets to emitted files.
- `declarationFiles`: collects and hashes the declaration package.

Keep the publication and failure behavior from plan 003: immutable versioned
contracts, last-good output on failure, cycle rejection, and external-file
watch recovery. Keep contextual route inference, including parent scope types.

## Scope

Only these implementation files may change:

- `packages/sprindle/src/tooling/manifest.ts`
- `packages/sprindle/src/tooling/manifest.spec.ts`
- `packages/sprindle/src/tooling/tooling.spec.ts`
- `packages/sprindle/docs/file-routing-tooling.md`
- This plan and `plans/README.md` for evidence and status

The required new behavior is direct relative imports of `.ts` source and local
`.d.ts` dependencies outside the project directory, including transitive sibling
imports. They use the application's existing dependency set.
Preserve existing in-project path aliases. Test an alias to an already-discovered
sibling file as part of the path mapping; do not build a new dependency resolver.

Out of scope: `language.ts` dependency-discovery redesign, external files reachable
only through currently undiscovered aliases, new `.mts`/`.cts` support, independent
package dependency versions in sibling source trees, compiler changes, runtime
bundling changes, source-manifest changes, Loom, API business code, migrations,
resets, seed data, and new user configuration. If the required regression needs
any of those changes, report the specific dependency before expanding scope.

## Path design

Use one common source ancestor and one relative-path mapping. Start with the
absolute project root; move it upward until all files to be copied are inside
it. Compare path segments with `node:path.relative`, not string prefixes. Include
virtual helpers and original declaration files. Do not scan or copy the common
ancestor directory. Only copy the files already selected by the overlay.

For a project with no external inputs, the common source root stays the project
root. With a sibling dependency, the layout becomes:

```text
Original                         Temporary input / declaration output
workspace/api/routes/...         api/routes/...
workspace/api/.__sprindle...      api/.__sprindle...
workspace/shared/result.ts       shared/result.ts / shared/result.d.ts
```

Use `relative(commonSourceRoot, originalFile)` consistently for source copies,
compiler root files, emitted helper copies, alias output targets, and published
route references. A small local path helper is sufficient; no path-mapping class.
Reject an absolute relative result or a `..` path segment that escapes the chosen
root before writing. A valid filename such as `..types.ts` is not a parent segment.
All generated writes and cleanup must stay inside the owned temporary directories.

Keep a distinct `stagedProject` path under the temporary input root. Put the
flattened compiler configuration there so project-relative options retain their
meaning. Set `rootDir` to the entire temporary input root and `outDir` to the
existing temporary declaration root. Put the virtual route definition at the
mapped project path. Compile the staged configuration with the existing CLI.

Keep existing dependency links available from both project and sibling files
through the common temporary ancestor. Do not copy `node_modules`. Do not invent
per-sibling package installation or dependency-version selection.

## Implementation steps

### 1. Add the failing direct-import test

In `manifest.spec.ts`, follow the existing fixture cleanup, framework package
symlink, and consumer type-check patterns. Use an owned temporary workspace
containing `api/` and `shared/`; pass `api/` as the project root.

The route imports a sibling function through a direct relative path. That
function imports a named type from another sibling module. Include a root scope
that provides `context.tenant.id`; the route output must contain that inferred
string and the sibling's named result type. Use actual `defineScope` and
`defineRoute` exports. Do not use a symlink for the shared source directory.

Parameterize the manifest compile over bundle and source modes. Both modes must
produce declarations. Compilation should currently fail with a missing copied
external file, not an invalid fixture or missing package.

After compilation, delete only the fixture's original `api/routes` and `shared`
source directories. Check a separate consumer with `tsc`, `skipLibCheck: false`,
and positive plus `@ts-expect-error` assertions for the exact output shape.
The consumer must resolve the published contract with no original source paths.

**Verify:** `pnpm --filter @southneuhof/sprindle exec vitest run src/tooling/manifest.spec.ts -t 'sibling source'`
Expected before the fix: the new cases fail during declaration emission.
Use 120-second test budgets, consistent with the approved heavy-load limits.

### 2. Apply the common-root mapping

Change `emitRouteDeclarations` and its existing alias helper in `manifest.ts`.
Trace every caller of `rewritePathAliases` and every `relative(projectRoot, ...)`
inside declaration emission before editing. Leave runtime route metadata relative
to the project root; only private compiler/output locations use the common root.

Apply the path design above to every coupled location. Do not replace one path
calculation while leaving compiler inputs or published imports on the old base.
Keep ordinary relative source imports unchanged. Resolve original alias targets
against the original effective configuration, then map them into staged input
or emitted output as appropriate. Rewrite module-specifier strings only; retain
the existing parser-based method so equal-looking string literals stay unchanged.

Copy required original `.d.ts` files into the output package at mapped paths as
well as copying generated `.r.d.ts` and `.s.d.ts` helpers. TypeScript does not emit
copies of input declaration files. Without this step, a consumer can fail after
the original source is removed even when the build succeeds.

Keep `--showConfig`, dependency links, compiler invocation, declaration hashing,
atomic publication, and cleanup. Do not add a compatibility output layout.
These files are private; regenerated `RouteContract` imports define the layout.

**Verify:** Run the new sibling-source test, then
`pnpm --filter @southneuhof/sprindle exec vitest run src/tooling/manifest.spec.ts`.
Expected: all cases pass, including existing type inference, alias literal,
publication, and cycle checks.

### 3. Check edits, failure preservation, and the normal command

Extend the sibling fixture with a local `.d.ts` dependency and an alias to a
sibling file already discovered by a direct import. Test these in the same
consumer proof rather than adding a broad resolver test matrix.

Add a sibling type-only edit. Require a new contract version and verify the new
consumer shape. Then introduce a real type error in a sibling source. Require
compilation to fail while the last valid runtime file and declaration entry
remain byte-for-byte unchanged. Correct the file and require a successful build.
Always clean up only fixture-owned files.

In `tooling.spec.ts`, reuse the normal build-command test pattern (`run(root,
'build.mjs')`) with a direct sibling import. Require exit 0 and a usable published
contract. This confirms the fix is reached through the existing CLI; a helper-only
test does not prove that boundary. Keep existing installed-package checks.

Document the supported direct sibling import and unchanged normal commands.
Record the limits from Scope without adding a user workaround requirement.

**Verify:** `pnpm --filter @southneuhof/sprindle test:tooling`
Expected: all tests pass with the standard command and no retry setting.

### 4. Run final checks and review

Run from the repository root with the installed dependencies:

| Check | Command | Expected |
| --- | --- | --- |
| Framework type-check and packaging | `pnpm --filter @southneuhof/sprindle type-check` | Exit 0 |
| Tooling suite | `pnpm --filter @southneuhof/sprindle test:tooling` | All pass |
| Framework lint | `pnpm --filter @southneuhof/sprindle lint` | Exit 0 |
| Existing application build | `pnpm --filter @southneuhof/api build` | Exit 0 |
| Existing SDK type contract | `pnpm --filter @southneuhof/sdk type-check` | Exit 0 |
| Patch check | `git diff --check` | Exit 0 |

Run type-check and build jobs sequentially because this machine can have heavy
background load. No database test, reset, browser test, install, commit, or push
is required. Review the complete change against this plan and the starting dirty
worktree. Record failed runs as well as the final results.

## Done criteria

- [x] Both manifest modes compile direct sibling and transitive relative imports.
- [x] Consumers type-check after fixture application and sibling sources are removed.
- [x] Parent context types, sibling named types, and local `.d.ts` inputs survive.
- [x] Existing aliases and string literals pass; discovered sibling aliases pass.
- [x] Type-only edits update the contract; failed builds preserve last-good output.
- [x] The normal build CLI passes the sibling-import case.
- [x] No staged path escapes its owned temporary root; cleanup remains scoped.
- [x] All final commands pass and unrelated work is preserved.
- [x] Plan and index are updated after review.

## Completion evidence

Implemented on 2026-09-10. The focused sibling test first failed with TS6053
for the uncopied sibling files. It then passed in bundle and source modes after
the common-root mapping was applied. Its regression proof changes only the
external `shared/brand.d.ts` type from `string` to `'local'`, keeps all runtime
source bytes unchanged, and type-checks consumers after source removal for both
contract versions. The final review used these commands:

- `pnpm --filter @southneuhof/sprindle type-check`: exit 0.
- `pnpm --filter @southneuhof/sprindle exec vitest run src/tooling/manifest.spec.ts -t 'sibling source'`: 2 tests passed.
- `pnpm --filter @southneuhof/sprindle test:tooling`: 40 tests passed.
- `pnpm --filter @southneuhof/sprindle lint`: exit 0.
- `pnpm --filter @southneuhof/api build`: exit 0.
- `pnpm --filter @southneuhof/sdk type-check`: exit 0.
- `git diff --check`: exit 0.

Self-review verdict: PASS. The common-root map is used for selected input copies,
compiler roots, path aliases, generated helpers, local declaration inputs, and
published route references. Runtime route metadata remains project-relative.
All writes stay in the owned input and declaration temporary trees. The tests
cover each done criterion. This plan has no UI or database obligation.

## Stop conditions and maintenance

Stop and report if the required dependencies are not in the existing overlay,
package resolution needs separate sibling dependency versions, a different-volume
path cannot be represented safely, or the fix needs source changes outside Scope.
Do not patch those cases by copying the whole repository or writing outside the
owned temporary roots. Report persistent failed checks instead of weakening their
assertions.

Future changes to aliases, declaration extensions, dependency discovery, or the
private contract layout must use the same path mapping. A source-based virtual
emitter can be considered later if the installed public compiler API supports it.
No extra architecture is needed now.

## Planning verification

The current source, compiler API declarations and implementation, package scripts,
existing tests, plan index, and prior review evidence were inspected. The current
compiler API inspection found only `Emitter.printNode`; no replacement emission
path was proved. No production source was edited and no new runtime proof of the
common-root fix was run during this planning step. The red/green tests above are
required implementation work. This was not a full repository audit.
