# API

`src/routes/` is the public API surface.

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

Register routes explicitly in `src/routes/index.ts`. Model routes generate RPC types from their Sprindle action tree. Custom Hono routes are typed from the route value itself, so use route-level validation such as `zValidator` for body, query, and param inputs.
