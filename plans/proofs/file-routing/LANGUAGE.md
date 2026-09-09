# In-memory route type proof

Date: 2026-09-08. Checkout: `00763ed`.

## Result

The source type gap has a working solution. Keep the public file shape:

```ts
import { defineRoute } from '@southneuhof/sprindle';

export const GET = defineRoute({
  action: ({ params, context }) => ({
    id: params.userId,
    owner: context.owner,
  }),
});
```

The Sprindle language service supplies a private view to TypeScript. In that
view, the helper import resolves to a file-specific declaration. That
declaration derives parameters from the directory and context from the
nearest parent `+scope.ts`. Parent scope declarations refer to their own
parents. TypeScript infers each context return type through that chain.

Only the private view changes. The source file, runtime import, and developer
instructions stay unchanged. No generated file exists on disk. The batch
checker uses the same private view as the language service.

This uses the installed TypeScript 7.0.2 native API and its virtual filesystem.
No package was installed. `language-core.mjs` uses the real compiler for
diagnostics, type queries, and completion. It does not invent completion lists
or copy expected types into test results. The resource record test derives
its row type from a real Zod select schema.

## Run

```sh
node plans/proofs/file-routing/language-proof.mjs
```

Expected: 10 checks pass. The fixture is created under ignored `node_modules/`
and removed when the test ends. There is no development server.

| Check | Observed result |
| --- | --- |
| Cold language service start | Exact parameter and inherited context types; zero diagnostics |
| Unsaved wrong parameter | TS2339 at the original source path and offset |
| Parameter completion | The actual file parameter appears; unrelated names do not |
| Wrong list record | Rejected against the inherited Zod record type |
| Unsaved parent scope edit | Child context diagnostics change immediately on the next request |
| Add a route | New parameters and inherited context are available |
| Move a route | New parameter and context types apply; old names fail |
| Delete a parent scope | Descendants lose the deleted scope's context |
| Ordinary commands | Fixture `pnpm type-check` and `pnpm build` pass; an invalid source causes type-check to exit 1 with the same diagnostics as the language service |
| Files on disk | No helper declarations; source imports remain unchanged |

The source offset test is exact. The proof replaces only a module string with
a shorter private import, then adds spaces to retain its width. Thus, later
positions in the private view and source remain equal. A control also checks
that an import example in a comment stays unchanged.

## Limits and production work

- This is a language-service core proof, not an installed editor extension.
  The editor must start the Sprindle language service through normal language
  support. The migration plan requires an editor-host test before app cutover.
- The command proof uses temporary package scripts with the normal command
  names. Production app scripts are unchanged. Like the current API build,
  the fixture build checks types and emits no JavaScript.
- Route helpers have reduced declaration contracts for the proof. The runtime
  proof separately uses actual Sprindle list/detail handlers. The production
  implementation must share complete helper contracts with the language layer.
- The TypeScript API entry point is marked unstable. Keep it within tooling,
  pin its supported version, and run the proof on compiler upgrades.
- The proof restarts the compiler service when the route tree changes. An
  initial attempt to send file-change notifications retained stale project
  roots. The restart makes the tested behavior correct. Measure this cost
  before replacing it with an incremental project reload.
- The import scanner covers ordinary named imports. Production must use an
  AST or complete mapping support for aliases, re-exports, comments, incomplete
  edits, and other accepted TypeScript forms. Do not copy the scanner as a
  complete parser.
- Hover, rename, go-to-definition, auto-import, and editor activation need
  separate integration checks. Internal helper paths must not appear in
  developer-facing results. The proof covers diagnostics and completion.
- No VS Code, other editor UI, database, SDK, or deployed server was changed.

The technical gap is resolved. A normal TypeScript editor without Sprindle
language support will not gain this behavior from a manifest alone. Ship the
language support as part of the framework setup; do not ask developers to
manage generated files or run a generator.
