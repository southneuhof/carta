# File routing proof

Date: 2026-09-08. Current checkout: `00763ed`.

## Result

The runtime proof passed. A second proof closes the source type gap with
in-memory, file-specific helper declarations. See [language proof](LANGUAGE.md).
The first compiler check remains as evidence that a manifest alone is insufficient.

The requirement remains:

> A developer can add, move, or delete a route without knowing that generation exists.

The technical proofs now support migration planning. Installation and activation
in an editor application remain release gates in the plans; the proof tests
the actual TypeScript language API, not a desktop editor extension.

## Run

From the repository root, with the existing dependencies installed:

```sh
apps/api/node_modules/.bin/tsx plans/proofs/file-routing/proof.ts
```

Expected: 13 checks pass. The last check confirms a type inference limit.
An exit code of zero does **not** mean that the full requirement passed.

The proof creates a temporary project under ignored `node_modules/`, then
removes that project in `finally`. It does not access a database or change
application or framework source. It uses Node 24.19.0 and TypeScript 7.0.2
from this checkout. No other worktree or branch was inspected.

## Evidence

| Check | Result |
| --- | --- |
| Start without generated files | Pass: the development runner creates static manifest imports |
| Public route outside an authenticated group | Pass |
| Parent rejection before child context work | Pass |
| Real Sprindle list parser, pagination, records, and response | Pass |
| Static path before a parameter path | Pass |
| Real Sprindle detail with the file path as its complete URL | Pass |
| Missing record response | Pass |
| Concurrent requests with separate context and one identity lookup each | Pass |
| Successful response hooks from child to parent | Pass |
| Add, edit, move, and delete while the runner is active | Pass: tests change files without calling the compiler |
| Error in child context reaches an entered parent error hook | Pass |
| Custom `list({ run })` retains its response contract | Pass |
| Custom POST returns a raw Response with its status and header | Pass |
| Duplicate URLs across groups and ambiguous parameter names | Pass: source paths appear in the error |
| Wrong resource method, missing entity, and missing default `id` | Pass: rejected before requests |
| Manifest supplies route-specific types to callbacks in source files | Failed design assumption; confirmed by a compiler test |

The move/delete test includes an existing parameter route. After the static
file disappears, that parameter route receives the request. Thus, the test
checks which handler runs, rather than assuming that every deleted route
must produce a 404.

## Type check details

The test creates a shared `defineRoute` function, a source route, and a
generated consumer. The consumer assigns the route this exact type:

```ts
Route<{ userId: string }, { user: { id: string } }>
```

The source callback still accepts `params.notARealParameter` when its helper
uses `Record<string, string>`. Its inherited `context.user` remains unknown.
The generated consumer does not change either result.

The test uses `@ts-expect-error` for the unknown context. If the context became
correctly typed, that directive would fail the check. A second compile gives
the source an explicit route type. That compile rejects the invalid parameter
with TS2339 and accepts `context.user.id`. This control shows that the first
result is not due to disabled type checking.

This agrees with TypeScript's description of
[contextual typing](https://www.typescriptlang.org/docs/handbook/type-inference):
the source expression needs its type context at that expression. A downstream
import does not provide that context to the original callback.

The earlier promise that ordinary shared imports could automatically provide
exact file-specific parameter and inherited context types was incomplete.
A generated manifest alone does not meet that promise.

## Proof limits

`runtime.ts` is a small adapter for the experiment. It uses the current
Sprindle list/detail executors and mounts their bound handlers at file paths.
Custom handlers use the current `defineRoute` executor internally. These
adapters are not a proposed compatibility layer for the migration.

The adapter uses broad types deliberately. The independent compiler test
prevents those broad types from being presented as proof of type safety.

Only the following file grammar was tested: static segments, required named
parameters, and URL-free groups. The watcher runs on the current macOS host.
It rebuilds the full fixture and retains manifest revisions until teardown.
It is not a production watcher or a test of dependency invalidation.

The proof does not implement all operation hook stages, named detail
parameter selection, create/update/delete, audit values, record conversion,
OpenAPI, SDK inference, HEAD, OPTIONS, or method-not-allowed behavior. These
remain acceptance checks for a complete implementation. No application
regression suite or database test was run because production source did not
change.

## Initial gap and its resolution

Keep the accepted file tree and hidden-generation requirement.

The second experiment supplies exact source types while preserving the
accepted import and handler shape. Framework-owned virtual typed files now
pass the language API and ordinary command checks. A TypeScript
language-service plugin alone does not run in `tsc`; see the
[TypeScript plugin documentation](https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin).

The language proof starts with no generated files and no development server.
It checks saved route changes and unsaved parent context changes. No desktop
editor integration was installed or tested. That packaging check remains
required before the migration can ship.

Do not replace these checks with global unions of every route context,
`any`, generated imports that developers must maintain, or instructions to
run a generation command. Those choices would weaken the accepted contract.

The improve plans cover framework tooling, runtime, and app migration.
They include SDK/OpenAPI migration and removal of manual registration.
Current URLs remain unchanged.
