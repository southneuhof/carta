# apps/api — agent runbook

Hono + Sprindle API. Framework vocabulary lives in
[`packages/sprindle/docs/reference.md`](../../packages/sprindle/docs/reference.md); read it before
inventing names. The exemplar resource is `src/routes/products/`.

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
2. Create `src/routes/<name>/<name>.model.ts` — `defineModel({ path: '/<name>', entity, authorize:
   [authenticated()], routes: { list: list(), … } })`. **Routes are public unless `authenticated()` is
   attached**; only `/health` and `/api/auth/*` are meant to be public.
3. Optional `src/routes/<name>/<name>.routes.ts` for custom routes, and `src/routes/<name>/<name>.ts`
   for composition (`defineDomainPart` + exports), following `routes/products/products.ts`.
4. Register in `src/routes/index.ts`: add the domain part to `domainParts` **and** the model to
   `installedRoutes`. Both arrays — a model missing from `domainParts` gets no bound database.
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
| `db:refresh` | `db:reset` then `db:seed` — use only when intentionally refreshing the development database |
| `db:smoke` | signs in as the seeded admin and exercises product create/update/delete |

## Notes

- Tests load `.env`, then `.env.test` when it exists, and apply pending migrations before Vitest.
  Keep `.env.test` pointed at a separate test database. Tests hit real Postgres and rebuild or leave
  fixture rows, so they must not use the development database.
- Spec files run serially (`vitest.config.ts` sets `fileParallelism: false`) for the same reason —
  in parallel, one file drops the tables another is using. Nothing else may touch that database
  while the suite runs.
- `GET /openapi.json` is generated from the installed models — no hand-maintained spec.
- CI: `.github/workflows/backend-validation.yml` runs lint, type-check, migrate and tests for this app
  and for `packages/sprindle`.
