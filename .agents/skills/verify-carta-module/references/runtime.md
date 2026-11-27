# Runtime proof

## API launch

Run from the repository root. Dependencies must be installed. If local env
files are missing, run `pnpm setup:local` and configure the named services.
The existing test database must be disposable and distinct from development.
Migrations and seed below make an empty database usable; they do not create the
PostgreSQL service or database. No storage service is needed for these recipes.
First require port 5190 to be free (`lsof -nP -iTCP:5190 -sTCP:LISTEN`).

```sh
pnpm module:preflight -- --needs api,test
pnpm --filter @southneuhof/api routes:compile
pnpm --filter @southneuhof/api db:seed:test
export VERIFY_RUN_DIR="$PWD/.local/verification/$(date -u +%Y%m%dT%H%M%SZ)-users"
mkdir -p "$VERIFY_RUN_DIR"
cd apps/api
export API_PORT=5190 BETTER_AUTH_URL=http://127.0.0.1:5190
export SPRINDLE_ROUTE_MANIFEST=.sprindle-test/routes.mjs
node --env-file-if-exists=.env --env-file=.env.test --import tsx src/server.ts > "$VERIFY_RUN_DIR/api.log" 2>&1 &
export VERIFY_API_PID=$!
trap 'kill "$VERIFY_API_PID" 2>/dev/null; wait "$VERIFY_API_PID" 2>/dev/null || true' EXIT
```

Wait for `Listening on port 5190` in `api.log`; an exited process is a launch
failure. Use this PID only from this launch, never an unknown existing server.

One configured test database and compiled manifest are shared. Keep live proof
and API test commands serial. Different ports alone do not isolate instances.
Use separate checkouts and separately guarded databases for concurrent runs.
Recompile and restart after API, schema, dependency, or environment changes.

## Doctor

From `apps/api`, in the launch shell:

```sh
set -o pipefail
node --env-file-if-exists=.env --env-file=.env.test ../../.agents/skills/verify-carta-module/scripts/control.mjs doctor | tee "$VERIFY_RUN_DIR/doctor.jsonl"
```

This read-only check requires the owned PID, API working directory, port,
test-target guard, connected database name, seeded administrator and role,
health response, and anonymous access denial. It uses `lsof` for ownership.
Run it before driving and whenever the instance is suspect. Health alone is
insufficient. The current build and server target come from the recorded launch
and route compile, not from a server version endpoint.

## Drive and evidence

From the same shell:

```sh
node --env-file-if-exists=.env --env-file=.env.test ../../.agents/skills/verify-carta-module/scripts/control.mjs users | tee "$VERIFY_RUN_DIR/users.jsonl"
```

The executable helper drives production HTTP routes, reads persisted effects,
and removes its own rows and administrator session in `finally`. It emits
actions, statuses, assertions, and cleanup results without credentials.
Its internal SQL writes create prerequisites and perform cleanup only.
Run it for the [Users recipe](../features/users.md), not as a mandatory extra
suite beside existing equivalent route tests. Retain logs and the real command
exit status in delivery notes. A failure is not a pass because cleanup succeeds.

## Cleanup

From the launch shell, on success or failure:

```sh
kill "$VERIFY_API_PID"
wait "$VERIFY_API_PID" || true
trap - EXIT
test -s "$VERIFY_RUN_DIR/doctor.jsonl"
test -s "$VERIFY_RUN_DIR/users.jsonl"
```

Confirm that the PID no longer owns port 5190. Preserve evidence. If the helper
was forcibly terminated, use its logged fixture email and role IDs to remove
only those records, then confirm removal. Never reset the database to clean up
a proof. Seed records remain available for later runs.

## Browser proof, only when selected

Run `pnpm verify:ui` from the repository root. Use `--routes list=/settings/users`
for a route list or `--config <path.json>` for per-route settings. In the config,
set `webUrl` and `apiUrl` for known servers. Use `startServers: true` to start
and stop local servers for the check. The owned API uses the database configured
in `apps/api/.env`. Start a separate isolated API for workflows that write
test data and give its URL to the command. For `--preview`, use a web build that
already points to the selected API.

Give each route a `name` and `path`. Set `viewports` to a list of `desktop` and
`mobile` and `themes` to a list of `light` and `dark` to select captures. Use
`selector` or `waitFor` to wait for an element or text. The top-level `login`
object supplies the default account. Set route `auth` to `false` for anonymous
routes or give it an `email` and `password` for a different account. Keep login
config in `.local/`.

For an interactive workflow, pass `--script <path.mjs>` or set `script` in the
config. Export an async default function. Use `newContext()` for anonymous
pages and `loginContext()` for the configured account. Pass an account to
`loginContext({ email, password })` to select it. Call
`await assertPageClean(page)` after the workflow. Check the relevant saved data
with a fresh read. Use `outDir` for evidence.

Read `report.json` and inspect the screenshots before reporting the result.
The default output directory is `.local/verification/verify-ui/`. Paths in
the config are relative to that file. Paths in command flags are relative to
the current directory.

For a maintained Playwright spec, use its existing package command. Read the
spec and its setup commands first. The default E2E fixture resets its database
and clears its storage bucket. Use the authorized isolated E2E target.
