# Phase 1: Workspace Foundation

## Goal

Put the monorepo on the package names, scripts, dependency graph, and TypeScript settings needed for the Hono RPC rewrite.

This phase should not implement runtime behavior yet. It makes the workspace able to resolve the new architecture cleanly.

## Repo Cross-Check

- `apps/api`, `packages/domain`, `packages/sdk`, and `packages/contracts` already exist, but their package names are still `@repo/*`.
- `packages/domain` currently exports material theme tokens, so the new domain framework exports must preserve or intentionally relocate that existing export.
- `packages/sdk` already contains a custom fetch wrapper. The target plan replaces this with native Hono RPC, so treat the current SDK as old active API wiring.
- Root `package.json` still builds and type-checks `@southneuhof/apostle` and SvelteKit-related packages. The target active path must exclude both.
- `packages/apostle` exists and must remain in the repo untouched.
- SvelteKit-related packages exist and must not be edited: `packages/landing-sveltekit-framework`, `packages/landing-section-schema`, and SvelteKit app-library code.

## Work

1. Update `apps/api/package.json`.
   - Rename to `@southneuhof/api`.
   - Set `"private": true` and `"type": "module"`.
   - Add scripts:
     - `dev`: `tsx watch src/server.ts`
     - `build`: `tsc -p tsconfig.json`
     - `type-check`: `tsc -p tsconfig.json --noEmit`
   - Add runtime dependencies:
     - `@hono/node-server`
     - `@hono/zod-validator`
     - `@southneuhof/domain`
     - `@southneuhof/contracts`
     - `drizzle-orm`
     - `hono`
     - `zod`
   - Add dev dependencies:
     - `tsx`
     - `typescript`

2. Update `packages/domain/package.json`.
   - Rename to `@southneuhof/domain`.
   - Set `"private": false` and `"type": "module"`.
   - Add exports:
     - `.`
     - `./actions`
     - `./model`
     - `./source`
   - Add dependencies:
     - `@hono/zod-validator`
     - `drizzle-orm`
     - `hono`
     - `zod`
   - Add `build` and `type-check` scripts.

3. Update `packages/contracts/package.json`.
   - Rename to `@southneuhof/contracts`.
   - Set `"private": false` and `"type": "module"`.
   - Keep the root export.
   - Add `build` and `type-check` scripts.

4. Update `packages/sdk/package.json`.
   - Rename to `@southneuhof/sdk`.
   - Set `"private": false` and `"type": "module"`.
   - Add exports:
     - `.`
     - `./client`
   - Add dependency:
     - `hono`
   - Add peer dependency:
     - `@southneuhof/api`
   - Add `build` and `type-check` scripts.

5. Update root `package.json` scripts.
   - `dev` should run `@southneuhof/api` and `@southneuhof/framework-web`.
   - `dev:web` should run only the web app.
   - `dev:api` should run only the API.
   - `build` should include:
     - `@southneuhof/domain`
     - `@southneuhof/contracts`
     - `@southneuhof/sdk`
     - `@southneuhof/is-data-model`
     - `@southneuhof/utilities`
     - `@southneuhof/is-vue-framework`
     - `@southneuhof/api`
     - `@southneuhof/framework-web`
   - `type-check` should include the same active packages.
   - Keep existing unrelated scripts unless they conflict.
   - Remove Apostle from the active build/type-check path only after active Vue imports are removed in Phase 3.

6. Update TypeScript config.
   - Set `"strict": true` in:
     - `apps/api/tsconfig.json`
     - `apps/web/tsconfig.json`
     - `packages/contracts/tsconfig.json`
     - `packages/sdk/tsconfig.json`
     - `packages/domain/tsconfig.json`
     - `packages/is-vue-framework/tsconfig.json`
   - Add source-first aliases for:
     - `@southneuhof/api`
     - `@southneuhof/contracts`
     - `@southneuhof/domain`
     - `@southneuhof/sdk`
   - Update `apps/web/vite.config.ts` aliases to point those package names at `src`.
   - Remove `@repo/sdk` aliases once `@southneuhof/sdk` is wired.

## Done When

- Package names match the target architecture.
- The active workflow scripts target the Hono RPC backend, SDK, contracts, domain, Vue framework, and web app.
- Source aliases resolve the new package names.
- Apostle and SvelteKit packages still exist, but are not the intended active backend communication path.
