# API

## Environment

Copy `.env.example` to `.env` and configure the database and auth settings. `BETTER_AUTH_URL` is the public API origin, while `APP_ORIGIN` is the browser origin allowed to send credentialed requests.

Auth is served at `/api/auth/*`. All routes except `/health` and `/api/auth/*` require a valid Better Auth session cookie.

`src/routes/` is the public API surface. Group related route files in folders.

Naming:

- `*.ts`: route entry
- `*.model.ts`: model entry
- `*.entity.ts`: entity entry
- `*.routes.ts`: custom model routes

Example:

```txt
src/routes/products/products.ts
src/routes/products/products.model.ts
src/routes/products/products.entity.ts
src/routes/products/products.routes.ts
```

Export first-class routes and models directly:

```ts
export const productModel = defineModel({
  path: '/products',
  entity: product,
  routes: { list: list(), detail: detail() },
})

export const healthRoute = defineRoute({
  path: '/health',
  method: 'get',
  action: () => ({ ok: true }),
})
```

Register routes explicitly in `src/routes/index.ts`, then install them with `installSprindle(app, routes)`. Model route RPC types come from their Sprindle route tree.
