# API

`src/routes/` is the public API surface. Group related route files in folders.

Naming:

- `*.ts`: route entry
- `*.model.ts`: model entry
- `*.entity.ts`: entity entry
- `*.actions.ts`: custom model actions

Example:

```txt
src/routes/products/products.ts
src/routes/products/products.model.ts
src/routes/products/products.entity.ts
src/routes/products/products.actions.ts
```

Declare every first-class endpoint group with `defineRoute()`:

```ts
export const productsRoute = defineRoute({
  path: '/products',
  model: productModel,
})

export const healthRoute = defineRoute({
  path: '/health',
  route: new Hono().get('/', (c) => c.json({ ok: true })),
})
```

Register routes explicitly in `src/routes/index.ts`, then install them with `installSprindle(app, routes)`. Model route RPC types come from their Sprindle action tree. Custom Hono routes are typed from the route value itself, so use route-level validation such as `zValidator` for body, query, and param inputs.
