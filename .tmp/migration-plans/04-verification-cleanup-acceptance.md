# Phase 4: Verification, Cleanup, And Acceptance

## Goal

Prove the rewrite works end to end, remove stale active wiring, and leave only the intended Hono RPC backend path in normal workflows.

This phase is where the old active API path finally gets cut from build/type-check scripts.

## Repo Cross-Check

- Current root scripts include SvelteKit packages and Apostle. After migration, active scripts should exclude them.
- The plan explicitly says not to touch SvelteKit packages and not to delete `packages/apostle`.
- Existing tests cover old SDK and Apostle-backed `FrameworkService`; those tests must be removed or rewritten to match the new active architecture.
- `apps/web` has `tsconfig.vitest.json` in its type-check script, so aliases may need updating there too, not just `tsconfig.app.json`.

## Work

1. Add domain runtime tests.
   - Test `defineModel()` route compilation through `app.request()`.
   - Required cases:
     - `actions: { list: list() }` -> `GET /list`
     - `actions: { list: { version1: list() } }` -> `GET /list/version1`
     - `actions: { list: { test: { versionTest: list() } } }` -> `GET /list/test/versionTest`
   - Keep tests small. Use one memory source and one Hono app.

2. Add type tests for Hono RPC shape.
   - Prove these compile:
     - `client.products.list.$get({ query: { page: '1', limit: '20' } })`
     - `client.products.nested.version1.$get()`
     - `client.products.nested.test.versionTest.$get()`
     - `client.products.detail[':id'].$get({ param: { id: 'product-1' } })`
   - Add negative checks:
     - `// @ts-expect-error client.products.missing.$get()`
     - `// @ts-expect-error client.products.nested.test.missing.$get()`
   - Put the type test where it participates in `pnpm type-check`; do not add a separate type-test runner unless needed.

3. Verify API routes.
   - Start or import `apps/api/src/app.ts`.
   - Confirm the required product routes respond:
     - `GET /products/list`
     - `GET /products/detail/:id`
     - `POST /products/create`
     - `PATCH /products/update/:id`
     - `DELETE /products/delete/:id`
     - `GET /products/nested/version1`
     - `GET /products/nested/test/versionTest`
     - `POST /products/customProductAction`
   - Confirm missing detail/update behavior returns `404` with `{ error: 'not_found' }`.

4. Final cleanup.
   - Remove Apostle from root `build` and `type-check` active filters after all active Vue imports are gone.
   - Leave `packages/apostle` files untouched.
   - Do not edit:
     - `packages/landing-sveltekit-framework`
     - `packages/landing-section-schema`
     - SvelteKit app-library code
   - Remove stale `@repo/*` aliases and package references.
   - Remove generated or stale `tsconfig.tsbuildinfo` only if they block type-check; otherwise leave them alone.

5. Run acceptance checks.
   - `pnpm type-check`
   - `pnpm build`
   - `pnpm dev`
   - If `pnpm dev` is long-running, verify it starts both:
     - `apps/api`
     - `apps/web`
   - Stop the dev process after confirming startup.

## Acceptance Criteria

- `pnpm type-check` passes.
- `pnpm build` passes.
- `pnpm dev` starts both API and web.
- `apps/api` exposes Hono routes from `defineModel()`.
- `apps/api` exports `AppType`.
- `packages/contracts` exports `AppType`.
- `packages/sdk` creates a native Hono RPC client.
- `packages/is-vue-framework` installs and exposes the Hono RPC client through Vue injection.
- `apps/web` uses the Hono RPC client instead of Apostle for active backend communication.
- `packages/apostle` still exists but is no longer bound to the active Vue app API path.
- Nested actions compile to nested Hono RPC paths.
- The Vue app can type-check `client.products.nested.test.versionTest.$get()`.
- No SvelteKit package or app-library framework is modified.

## Final Architecture

```txt
apps/api
  owns the Hono app and exports AppType

packages/domain
  owns defineModel, action trees, model actions, and source adapters

packages/contracts
  exposes the API type contract

packages/sdk
  creates the native Hono RPC client

packages/is-vue-framework
  installs and exposes the RPC client to Vue

apps/web
  consumes the RPC client through is-vue-framework
```

## Developer-Facing Model API

```ts
export default defineModel({
  name: 'products',
  model: products,
  source: productSource,

  actions: {
    list: list(),
    detail: detail(),
    create: create(),
    update: update(),
    delete: deleteAction(),

    nested: {
      version1: list(),
      test: {
        versionTest: list(),
      },
    },

    customProductAction,
  },
})
```

## Frontend-Facing Client API

```ts
await client.products.list.$get()
await client.products.detail[':id'].$get({ param: { id } })
await client.products.nested.test.versionTest.$get()
```
