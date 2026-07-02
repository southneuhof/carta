# Phase 3: Contracts, SDK, Vue Injection, And Web Migration

## Goal

Make the Hono app type flow to the frontend, replace custom/Apostle-style active API clients with native Hono RPC, and wire the RPC client into the Vue app.

This phase removes Apostle from the active communication path without deleting `packages/apostle`.

## Repo Cross-Check

- `packages/contracts/src/index.ts` is currently empty.
- `packages/sdk/src/client.ts` currently implements a custom fetch client with endpoint helpers. The target SDK should not keep `api.products.create(...)` wrappers or Apostle-like endpoint helpers.
- `packages/is-vue-framework/src/services/FrameworkService.ts` imports `@southneuhof/apostle`.
- `packages/is-vue-framework/src/services/types.ts` imports Apostle types.
- `apps/web/src/utils/services.ts` subclasses `FrameworkService`.
- Many active web behavior files import `@/utils/services`, including CRUD, form, lookup, table, upload, location, select, checkbox/radio, and file manager behavior modules.
- `apps/web/src/main.ts` already installs `createFrameworkPlugin`; this is the right place to install the RPC client too.
- `apps/web/src/config.ts` already normalizes `VITE_API_URL`, but the target plan also wants a fallback of `http://localhost:8787` when wiring the client.

## Work

1. Export the API contract.
   - In `packages/contracts/src/index.ts`, export:
     - `export type { AppType } from '@southneuhof/api/app'`
   - Do not generate OpenAPI files.
   - Do not add code generation.

2. Replace the SDK with native Hono RPC.
   - `packages/sdk/src/client.ts`:
     - Import `hc` from `hono/client`.
     - Import `AppType` from `@southneuhof/contracts`.
     - Export `createRpcClient(baseUrl: string)`.
     - Use credentials `include`.
     - Export `RpcClient`.
   - `packages/sdk/src/index.ts`:
     - Export `createRpcClient`.
     - Export `RpcClient`.
     - Re-export `AppType`.
   - Remove old custom fetch wrapper exports:
     - `createAPIClient`
     - `ApiClient`
     - `ApiMethod`
     - `ApiRequest`
     - `ApiResponseType`
     - `CreateAPIClientOptions`
   - Remove or rewrite `packages/sdk/src/__tests__/client.spec.ts` so it tests the Hono RPC client shape instead of the old wrapper.

3. Add Hono RPC service injection to `packages/is-vue-framework`.
   - Add `@southneuhof/sdk` dependency.
   - Create:
     - `src/services/api/index.ts`
     - `src/services/api/client.ts`
   - Implement:
     - `IsApiClientKey`
     - `createIsApiClient(baseUrl: string): RpcClient`
     - `installIsApiClient(app: App, client: RpcClient)`
     - `useIsApiClient(): RpcClient`
   - `useIsApiClient()` throws `Hono RPC client is not installed.` when missing.
   - Export from:
     - `packages/is-vue-framework/src/services/index.ts`
     - `packages/is-vue-framework/src/index.ts`
   - This is Vue dependency injection around the raw Hono RPC client only. Do not build endpoint wrappers.

4. Unbind Apostle from `packages/is-vue-framework`.
   - Search and remove active imports of:
     - `@southneuhof/apostle`
     - `apostle-http`
     - `axios`
     - `Apostle`
   - Replace or delete `FrameworkService` and related Apostle types once app usage has moved.
   - Remove `@southneuhof/apostle` from `packages/is-vue-framework/package.json` after imports are gone.
   - Remove Apostle tsconfig path/include entries from `packages/is-vue-framework/tsconfig.json`.
   - Keep `packages/apostle` source intact.

5. Wire the RPC client into `apps/web`.
   - Add `@southneuhof/sdk` as needed through `@southneuhof/is-vue-framework` exports, or consume only the framework service API from the app.
   - In `apps/web/src/main.ts`, create:
     - `const apiClient = createIsApiClient(import.meta.env.VITE_API_URL ?? 'http://localhost:8787')`
   - Install it:
     - `installIsApiClient(app, apiClient)`
   - Keep existing `createFrameworkPlugin` setup.
   - Add `apps/web/.env.example`:
     - `VITE_API_URL=http://localhost:8787`

6. Replace active web service usage.
   - Migrate `apps/web/src/utils/services.ts` away from `FrameworkService` or delete it when no longer used.
   - Replace active backend communication in app behavior modules with native RPC calls where the target route exists.
   - Required proof calls:
     - `client.products.list.$get({ query: { page: '1', limit: '20' } })`
     - `client.products.nested.test.versionTest.$get()`
   - For existing legacy endpoints without Hono equivalents yet, either:
     - migrate them to `apps/api` in Phase 2/this phase if they are active and required for type-check, or
     - keep a tiny transitional local fetch only in `apps/web`, marked with `ponytail:` and not exported by `is-vue-framework`.
   - Do not keep Apostle as the default API client.
   - Do not add wrappers that mimic Apostle.

7. Clean web aliases and dependencies.
   - Remove `@southneuhof/apostle` aliases from `apps/web/vite.config.ts` and `apps/web/tsconfig.app.json` after imports are gone.
   - Add aliases for:
     - `@southneuhof/api`
     - `@southneuhof/contracts`
     - `@southneuhof/domain`
     - `@southneuhof/sdk`
   - Remove `apostle-http` from `apps/web/package.json` if unused.
   - Remove `axios` only if it is no longer used anywhere active.

## Done When

- `packages/contracts` exports `AppType`.
- `packages/sdk` creates a native Hono RPC client and exposes the raw Hono client shape.
- `packages/is-vue-framework` installs and exposes the RPC client through Vue injection.
- `apps/web` installs the RPC client during bootstrap.
- Active Vue/web backend communication no longer depends on Apostle.
- `packages/apostle` still exists and was not deleted.
