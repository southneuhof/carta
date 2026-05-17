# @client/web

This is the web client app inside the South Neuhof client monorepo template.

## Commands

```bash
pnpm --filter @client/web dev
pnpm --filter @client/web build
pnpm --filter @client/web type-check
pnpm --filter @client/web test
```

Runtime configuration is read from Vite environment variables. Copy values from `env.sample` into a local `.env` file for development.
