# South Neuhof Information System Framework

Canonical framework monorepo for South Neuhof information system frontends.

Clone this repository to contribute to the framework packages and reference apps:

```sh
git clone https://github.com/southneuhof/is-framework
```

Current status:

- `apps/web` is the active Vue 3 + Vite frontend.
- `apps/api` is a placeholder for the future backend app.
- `apps/base-mobile` is the active Expo mobile baseline.
- `packages/contracts`, `packages/sdk`, and `packages/domain` are scaffolded package boundaries only.
- `packages/is-data-model` contains shared model config types and runtime helpers.
- `packages/is-vue-framework` contains Vue components, services, and app patterns.
- `packages/apostle` contains HTTP helpers used by `vue-framework`.
- `packages/data-model` contains project-owned model definitions (base/web/mobile).

## Workspace Layout

```txt
apps/
  api/              # backend placeholder
  base-mobile/      # active Expo mobile app
  web/              # active Vue frontend
packages/
  contracts/        # future generated API contracts
  sdk/              # shared API client wrapper
  domain/           # future shared domain primitives
  is-data-model/       # shared model metadata + runtime config builders
  is-vue-framework/    # Vue framework components and patterns
  apostle/          # HTTP helper package
  data-model/       # project-owned model definitions (base/web/mobile)
```

## Commands

The repository is standardized on `pnpm`.

- `pnpm dev` - run the Vue sandbox app with framework source aliases
- `pnpm dev:mobile` - run the mobile app (`apps/base-mobile`)
- `pnpm build` - build framework packages and the web sandbox
- `pnpm test` - run framework package and web sandbox tests
- `pnpm type-check` - type-check workspace packages and apps
- `pnpm type-check:mobile` - type-check the mobile app
- `pnpm packages:status` - show package branch status
- `pnpm packages:pull` - pull package branches into `packages/*`
- `pnpm packages:push` - push `packages/*` source to package branches
- `pnpm push:all` - push package branches and the current repo branch

## Framework Package Flow

Framework development is source-first. The sandbox web app resolves `@southneuhof/is-data-model`, `@southneuhof/is-vue-framework`, and `@southneuhof/apostle` directly to `packages/*/src` through Vite and TypeScript aliases, so framework edits work with normal Vite HMR. Landing framework work follows the same source-first pattern from `packages/landing-sveltekit-framework/src`.

Package manifests export source files from `src`. Generated `dist` output and local pack tarballs are not source artifacts.

## Package Repository Mirrors

This monorepo is the source of truth. The individual package repositories are generated mirrors of package source folders:

```txt
packages/is-data-model    -> https://github.com/southneuhof/is-data-model
packages/apostle       -> https://github.com/southneuhof/apostle
packages/utilities     -> https://github.com/southneuhof/utilities
packages/is-vue-framework -> https://github.com/southneuhof/is-vue-framework
packages/landing-section-schema -> https://github.com/southneuhof/landing-section-schema
packages/landing-sveltekit-framework -> https://github.com/southneuhof/landing-sveltekit-framework
```

Open framework issues and pull requests against this monorepo, not the mirror repositories.

Maintainers can sync package branches manually:

```sh
pnpm packages:push
```

CI also syncs package branches from `main` through `.github/workflows/sync-package-branches.yml`. The workflow requires a `GH_PACKAGES_TOKEN` secret that can push to the package repositories.

## Web App

See [apps/web/README.md](apps/web/README.md) for frontend-specific setup and runtime notes.
