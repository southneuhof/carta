# Phase 2: Domain Framework And API Vertical Slice

## Goal

Implement the backend framework core: `defineModel()`, recursive action trees, model actions, model sources, Hono route compilation, and a working `apps/api` product model.

This is the main backend phase. Keep it boring: one framework path, one product demo, no codegen.

## Repo Cross-Check

- `packages/domain/src/index.ts` currently only exports theme tokens. Preserve that export while adding the framework API.
- `apps/api` currently has no `src` tree, so the Hono app and product demo are new files.
- The existing `packages/data-model` / `packages/is-data-model` model metadata packages are separate from this backend `defineModel()` API. Do not rewrite them in this phase.
- The original plan asks for `createDrizzleSource()` but also says to use an in-memory source for the first product slice. Do both: production adapter exists, product demo uses memory.

## Work

1. Add `packages/domain/src` framework structure.
   - `model/index.ts`
   - `model/define-model.ts`
   - `model/action-tree.ts`
   - `model/action-types.ts`
   - `model/model-context.ts`
   - `actions/index.ts`
   - `actions/list.ts`
   - `actions/detail.ts`
   - `actions/create.ts`
   - `actions/update.ts`
   - `actions/delete.ts`
   - `actions/define-action.ts`
   - `source/index.ts`
   - `source/model-source.ts`
   - `source/drizzle-source.ts`
   - `validation/index.ts`
   - `validation/common-schemas.ts`

2. Implement branded action types.
   - Export `MODEL_ACTION = Symbol('MODEL_ACTION')`.
   - Export `HttpMethod`.
   - Export `ModelAction<TContext>`.
   - Export `BoundModelAction`.
   - Export `isModelAction(value)`.
   - Keep `any` out of public exports. If a cast is unavoidable, keep it inside the route compiler.

3. Implement `defineAction(config)`.
   - Action owns:
     - HTTP method.
     - Extra action path suffix.
     - Validators.
     - Handler.
   - `bind(context)` returns:
     - method
     - path
     - validators
     - handler that calls `config.handler({ c, context })`.

4. Implement `ModelSource`.
   - Methods:
     - `list({ query, context })`
     - `detail({ id, context })`
     - `create({ input, context })`
     - `update({ id, input, context })`
     - `delete({ id, context })`
   - Include `ModelRuntimeContext`.
   - `defineModel()` accepts `model`, `source`, or both. If both exist, `source` performs data access and `model` is metadata.

5. Implement `createDrizzleSource()`.
   - Input:
     - `db`
     - `table`
     - `idColumn`
     - `schemas.create`
     - `schemas.update`
     - `schemas.select`
   - Output: `ModelSource`.
   - Keep the implementation minimal and table-backed. Do not add repository classes.

6. Implement default framework actions.
   - `list()`
     - `GET /{modelName}/{actionPath}`
     - Default action path `''`.
     - Query schema:
       - `page`: positive int, default `1`
       - `limit`: positive int, max `100`, default `20`
       - `search`: optional string
     - Response: `{ data, page, limit, total? }`
   - `detail()`
     - `GET /{modelName}/{actionPath}/:id`
     - Param schema: `{ id: z.string().min(1) }`
     - Response: `{ data }`
     - Missing record: `{ error: 'not_found' }` with status `404`.
   - `create()`
     - `POST /{modelName}/{actionPath}`
     - Uses source `create`.
     - Response: `{ data }` with status `201`.
   - `update()`
     - `PATCH /{modelName}/{actionPath}/:id`
     - Uses source `update`.
     - Response: `{ data }`.
     - Missing record should return `404`.
   - `deleteAction()`
     - `DELETE /{modelName}/{actionPath}/:id`
     - Uses source `delete`.
     - Response: `{ ok: true }`.
     - Export as `deleteAction`, not `delete`.

7. Implement recursive action tree compilation.
   - `compileActionTree({ app, context, tree, segments })`.
   - Walk nested plain objects.
   - Detect actions with `isModelAction()`.
   - Accumulate object keys as URL path segments.
   - Preserve camelCase keys as camelCase URL segments.
   - Bind each action with the model context.
   - Mount with `app[method](finalPath, ...validators, handler)`.
   - Final path inside model route:
     - `'/' + segments.join('/') + boundAction.path`
   - Examples to preserve:
     - `list()` at `actions.list` -> `/list`
     - `detail()` at `actions.detail` -> `/detail/:id`
     - `nested.version1` -> `/nested/version1`
     - `nested.test.versionTest` -> `/nested/test/versionTest`

8. Implement `defineModel()`.
   - Input shape supports:
     - `name`
     - `model`
     - `source`
     - recursive `actions`
   - Return:
     - `name`
     - `route: Hono`
     - original `actions`
     - bound model `context`
   - Compile action routes onto the returned Hono route.

9. Implement `apps/api/src`.
   - `app.ts`
     - Create Hono app.
     - Add CORS for `http://localhost:5173` with credentials.
     - Mount `productModel.route` at `/products`.
     - Export `AppType = typeof app`.
   - `server.ts`
     - Serve `app.fetch` on `process.env.PORT ?? 8787`.
   - `context.ts`
     - Keep only shared API runtime context that is actually used.
   - `domains/products/product.table.ts`
     - Drizzle `products` table with `id`, `name`, `sku`, `createdAt`.
   - `domains/products/product.source.ts`
     - Temporary in-memory `ModelSource`.
   - `domains/products/product.custom-actions.ts`
     - `POST /products/customProductAction`.
   - `domains/products/product.model.ts`
     - Use `defineModel()` with:
       - list/detail/create/update/delete
       - nested `version1`
       - nested `test.versionTest`
       - `customProductAction`

## Required Product Endpoints

- `GET /products/list`
- `GET /products/detail/:id`
- `POST /products/create`
- `PATCH /products/update/:id`
- `DELETE /products/delete/:id`
- `GET /products/nested/version1`
- `GET /products/nested/test/versionTest`
- `POST /products/customProductAction`

## Done When

- `apps/api` exposes Hono routes generated from `defineModel()`.
- Nested actions compile into nested Hono RPC paths.
- `apps/api` exports `AppType`.
- `packages/domain` exposes model, actions, source, and validation APIs without dropping its existing theme token export unless deliberately moved.
