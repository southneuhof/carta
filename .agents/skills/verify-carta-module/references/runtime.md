# Runtime proof

## Verification commands

Run these commands from the repository root:

- Inner-loop edits: `pnpm verify:module --fast --api-test <spec>`
- Final gate: `pnpm verify:module`
- Stale test database schema: `pnpm --filter @southneuhof/api db:refresh:test`
- Prerequisites: `pnpm module:preflight -- --needs api,web,test,storage`

One configured test database and compiled manifest are shared across runs. Keep
live proof and API test commands serial unless using separate checkouts and
separately guarded databases.

## Browser proof, only when selected

Run `pnpm verify:ui` from the repository root. Pass `--routes list=/settings/users`
or `--config <path.json>` with `webUrl`/`apiUrl` (or `startServers: true` to
boot and tear down owned local servers). The owned API uses `apps/api/.env`;
pass an isolated API URL for workflows that write test data. For `--preview`,
use a web build targeting that API.

Configure routes with `name`, `path`, `viewports` (`desktop`, `mobile`),
`themes` (`light`, `dark`), optional `selector` or `waitFor`, and `auth`
(`false` for anonymous or `{ email, password }` to override top-level `login`).
Keep login configs in `.local/`. Capture representative changed routes across
desktop light, 375 px mobile, and dark mode. Use `--concurrency <n>` (default
`4`) to adjust worker count.

For interactive workflows, pass `--script <path.mjs>` (or `script` in config)
exporting an async default function receiving `{ browser, newContext,
loginContext, webUrl, apiUrl, outDir, assertPageClean }`. Call
`await assertPageClean(page)` and verify persisted data with a fresh read.
Inspect `report.json` and the saved screenshots under `.local/verification/`
before reporting results.

For a maintained Playwright spec, use its package script against the authorized
isolated E2E target (the default E2E fixture resets its database and clears its
storage bucket). For the standalone `control.mjs` Users HTTP harness, see
[Users recipe](../features/users.md).
