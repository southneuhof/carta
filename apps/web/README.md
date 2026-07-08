# Base Frontend Web App

Admin frontend built with Vue 3 + Vite + TypeScript.
This app now lives inside the monorepo at `apps/web`.

## Tech Stack

- Vue 3 (`script setup`, async components)
- Vite 4
- TypeScript
- Vue Router (hash history)
- Pinia
- Tailwind CSS + PostCSS
- Vitest + Vue Test Utils
- ESLint + Prettier

## Requirements

- Node.js 18+ (recommended)
- pnpm at the monorepo root

## Getting Started

From the monorepo root:

```sh
pnpm dev
```

Or run the web app directly from `apps/web` with the package scripts defined in this package.

## Available Scripts

- `dev` - start Vite dev server
- `build` - build for production
- `preview` - preview production build on port `3100`
- `test` - run unit tests with Vitest (`jsdom`)
- `test:unit` - same as `test`
- `type-check` - run type checking via `vue-tsc`
- `lint` - run ESLint with autofix

## Environment Variables

- `GOOGLE_MAP_API_KEY`: used by map components
- `VITE_API_URL`: API base URL for app services
- `VITE_APP_BYPASS_ALL_PERMISSIONS`: set to `true` to bypass permission checks

Vite is configured with:

```ts
envPrefix: ['VITE_', 'GOOGLE_MAP_API_KEY']
```

## Runtime Configuration Notes

- API base URL comes from `VITE_API_URL`
- Permission bypass comes from `VITE_APP_BYPASS_ALL_PERMISSIONS`
- Company code is set in `src/company.ts`

## Current Baseline

- unit tests pass
- type-check passes
- production build currently fails due to a missing asset: `src/assets/corporate/assets/logo-hka.png`
