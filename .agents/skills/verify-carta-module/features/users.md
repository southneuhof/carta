# Users

Administrators create credential accounts with initial roles, edit users, and
disable them with session invalidation.

## Sub-features

- `users-create`: credentials and exact initial role assignments persist.
- `users-edit`: name changes persist without changing email.
- `users-disable`: disabling an active user ends all of that user's sessions.
- `users-rules`: duplicate email, invalid initial roles, and creation cleanup.

## How to get to it (user POV)

Open Settings → Users (`/settings/users`), then Create, row View, or row Edit.
Direct routes are `/settings/users/create`, `/settings/users/:userId/detail`,
and `/settings/users/:userId/edit`. Role Assignments is a child of detail.
The HTTP equivalents are `POST /users/create`, `GET /users/detail/:id`,
`PATCH /users/update/:id`, and `GET /users/:userId/role-assignments`.

## Driving it with HTTP and Vitest

Preconditions: guarded migrated test database, seeded administrator, and an
owned API instance on free port `5190`:

```sh
pnpm module:preflight -- --needs api,test
pnpm --filter @southneuhof/api routes:compile
pnpm --filter @southneuhof/api db:seed:test
export VERIFY_RUN_DIR="$PWD/.local/verification/$(date -u +%Y%m%dT%H%M%SZ)-users"
mkdir -p "$VERIFY_RUN_DIR"
cd apps/api
export API_PORT=5190 BETTER_AUTH_URL=http://127.0.0.1:5190 SPRINDLE_ROUTE_MANIFEST=.sprindle-test/routes.mjs
node --env-file-if-exists=.env --env-file=.env.test --import tsx src/server.ts > "$VERIFY_RUN_DIR/api.log" 2>&1 &
export VERIFY_API_PID=$!
trap 'kill "$VERIFY_API_PID" 2>/dev/null; wait "$VERIFY_API_PID" 2>/dev/null || true' EXIT
```

Wait for `Listening on port 5190` in `api.log`, then run from `apps/api`:

```sh
set -o pipefail
node --env-file-if-exists=.env --env-file=.env.test ../../.agents/skills/verify-carta-module/scripts/control.mjs doctor | tee "$VERIFY_RUN_DIR/doctor.jsonl"
node --env-file-if-exists=.env --env-file=.env.test ../../.agents/skills/verify-carta-module/scripts/control.mjs users | tee "$VERIFY_RUN_DIR/users.jsonl"
kill "$VERIFY_API_PID"; wait "$VERIFY_API_PID" || true; trap - EXIT
```

- `control.mjs users` signs in, creates an account with two fixture roles,
  updates its name with unchanged email, proves two sessions work, disables the
  account, verifies zero stored sessions and two denied `/me` requests while the
  administrator session remains valid, and removes its own fixtures in `finally`.
- Run it only when specifically verifying the Users recipe, not beside
  equivalent route tests.
- For changed creation rules, reuse
  `pnpm --filter @southneuhof/api test:focused -- 'src/routes/(authenticated)/users/users.routes.spec.ts' 'src/routes/(authenticated)/users/users.compensation.spec.ts'`
  from the repository root. Read each case's scope; the existing revocation
  case has one session, not proof of the all-sessions contract.

## Gotchas

The HTTP helper proves no UI entry point. Standard create/edit bags need
configuration review and type checks. If confirmation is a selected business
risk or an explicitly requested browser case, check that Cancel preserves state
and Confirm performs the write. This recipe does not require that browser case
for every change. Existing route specs may retain fixture rows; use only the
disposable target. Do not duplicate their rules in new unit, component, or
browser suites. Better Auth account creation can leave an initial session. The
helper counts it before two sign-ins and requires every stored session to be
removed.
