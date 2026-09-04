# apps/api — agent runbook

Hono + Sprindle API. Framework vocabulary lives in
[`packages/sprindle/docs/reference.md`](../../packages/sprindle/docs/reference.md); read it before
inventing names. Conventions live in `docs/architecture/api-conventions.md`; read it before adding or changing a module. The exemplar resources are `src/routes/users/` for standard CRUD and `src/routes/roles/` for the route → service shape. The operational rule book for agents is the `api-conventions` skill (`.agents/skills/api-conventions/SKILL.md`); the charter stays the human-readable summary and must not diverge from it — when rules change, change the skill first.

## Setup

```bash
cp .env.example .env
```

```bash
pnpm --filter @southneuhof/api db:migrate
```

```bash
pnpm --filter @southneuhof/api db:seed
```

`db:seed` is idempotent and creates `admin@example.com` / `demo-password`.

## Add a resource

1. Create `src/routes/<name>/<name>.entity.ts` — Drizzle table(s), `drizzle-zod` schemas, `createEntity`,
   and a `defineRelationsPart` if it has relations.
2. Create `src/routes/<name>/<name>.ts` — `defineModel({ path: '/<name>', entity, authorize:
   [authenticated()], routes: { list: list(), … } })` beside `<name>.entity.ts` (see `users/users.ts`;
   there is no `<name>.model.ts` file). **Routes are public unless `authenticated()` is
   attached**; only `/health` and `/api/auth/*` are meant to be public.
3. Optional `src/routes/<name>/<name>.routes.ts` for custom routes, following `routes/users/users.routes.ts`.
4. Register in `src/routes/index.ts`: add ONE `defineModule({ domain, models })` bundle to the
   matching group (the generator does this for manifest modules). The bundle pairs the module's
   database ownership with its routes — a missing `domain` fails at boot with an unbound-model
   error instead of failing per request.
5. Generate and apply the migration:

```bash
pnpm --filter @southneuhof/api db:generate
```

```bash
pnpm --filter @southneuhof/api db:migrate
```

Review the generated SQL in `drizzle/` and commit it with the entity change. Never edit an applied
migration.

6. Verify:

```bash
pnpm --filter @southneuhof/api test
```

For one or more API specs, use the test-aware focused command. It applies
pending migrations to `.env.test` and forwards the spec paths after `--`:

```bash
pnpm --filter @southneuhof/api test:focused -- src/routes/<name>/<name>.routes.spec.ts
```

```bash
pnpm --filter @southneuhof/api type-check
```

```bash
pnpm --filter @southneuhof/api lint
```

## Schema errors at boot

`defineDomainSchema` validates entities, relations and nested schemas at startup and throws with the
remediation in the message (for example: nested object fields must use another entity's
`schemas.select`). Read the whole error — it names the entity, the field and the fix. Do not work
around it by loosening the schema.

## Database commands

| Command | Effect |
|---|---|
| `db:generate` | diff entities against migration history → new SQL file |
| `db:migrate` | apply pending migrations (history in the `drizzle` schema) |
| `db:push` | dev-only direct schema sync, no history |
| `db:reset` | drop every table in `public` + migration history, then migrate |
| `db:seed` | idempotent development seed |
| `db:migrate:test` | apply pending migrations to the `.env.test` database |
| `db:seed:test` | migrate and seed the `.env.test` database |
| `db:refresh` | `db:reset` then `db:seed` — use only when intentionally refreshing the development database |
| `db:smoke` | signs in as the seeded admin and exercises product create/update/delete |

## Notes

- Tests load `.env`, then `.env.test` when it exists, and apply pending migrations before Vitest.
  Keep `.env.test` pointed at a separate test database. Tests hit real Postgres and rebuild or leave
  fixture rows, so they must not use the development database. Do not run bare `db:migrate` before
  focused tests; use `test:focused -- <spec>` or `db:migrate:test`.
- Spec files run serially (`vitest.config.ts` sets `fileParallelism: false`) for the same reason —
  in parallel, one file drops the tables another is using. Nothing else may touch that database
  while the suite runs.
- `GET /openapi.json` is generated from the installed models — no hand-maintained spec.
- CI: `.github/workflows/backend-validation.yml` runs lint, type-check, migrate and tests for this app
  and for `packages/sprindle`.
