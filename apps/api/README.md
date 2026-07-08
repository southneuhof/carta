# API

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

Mount every first-class endpoint group with `mountRoute()`:

```ts
export const productsMount = mountRoute({
  path: '/products',
  model: productModel,
})

export const healthMount = mountRoute({
  path: '/health',
  route: new Hono().get('/', (c) => c.json({ ok: true })),
})
```

Register mounts explicitly in `src/routes/index.ts`, then install them with `installSprindle(app, mounts)`. Model route RPC types come from their Sprindle route tree. Custom Hono routes are typed from the route value itself, so use route-level validation such as `zValidator` for body, query, and param inputs.
