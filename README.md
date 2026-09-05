# Carta

Carta template: Users, Roles, Permissions on Better Auth. API port 5180, web port 5181, PostgreSQL database `carta`.

## Layout

```txt
apps/api/   # Hono API: health, auth, users, roles, permissions, files
apps/web/   # Vue 3 admin: dashboard, settings users/roles/permissions
packages/   # sprindle, sdk, utilities, loom (framework, unchanged)
```

## Quick setup

Create a new app from any parent directory:

```sh
npx --yes create-carta-app@latest my-app
```

To configure the project remote during setup:

```sh
npx --yes create-carta-app@latest my-app --remote <private-repo-url>
```

## Start

```sh
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm install
pnpm --filter @southneuhof/api db:migrate
pnpm --filter @southneuhof/api db:seed
pnpm dev
```

Seed the admin with `CARTA_ADMIN_EMAIL` and `CARTA_ADMIN_PASSWORD`.

## Skills

Agent skills live separately at `southneuhof/skills` and are not vendored here.
Install what you need:

```sh
npx skills@latest add southneuhof/skills --skill api-conventions
npx skills@latest add southneuhof/skills --skill web-ui-surfaces
```

## Permissions

Flat global codes: `view/list/detail/create/update-users`,
`view/list/detail/create/update/delete-roles`,
`view/list/detail-permissions`,
`list/create/delete-role-permissions`,
`list/create/delete-role-assignments`.
