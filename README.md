# South Neuhof Information System Framework

Canonical framework lab monorepo for South Neuhof information system frontends.

Clone this repository to contribute to the framework, its publishable libraries, and the Vue sandbox/reference app:

```sh
git clone https://github.com/southneuhof/is-framework
```

Current status:

- `apps/web` is the active Vue 3 + Vite frontend.
- `apps/api` is a placeholder for the future backend app.
- `apps/base-mobile` is the active Expo mobile baseline.
- `packages/contracts`, `packages/sdk`, and `packages/domain` are scaffolded package boundaries only.
- `packages/model-meta` contains shared model config types and runtime helpers, published as `@southneuhof/is-data-model`.
- `packages/vue-framework` contains Vue components, services, and app patterns, published as `@southneuhof/is-vue-framework`.
- `packages/apostle` contains HTTP helpers used by `vue-framework`, published as `@southneuhof/apostle`.
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
  model-meta/       # shared model metadata + runtime config builders
  vue-framework/    # Vue framework components and patterns
  apostle/          # HTTP helper package
  data-model/       # project-owned model definitions (base/web/mobile)
```

## Commands

The repository is standardized on `pnpm`.

- `pnpm dev` - run the Vue sandbox app with framework source aliases
- `pnpm dev:mobile` - run the mobile app (`apps/base-mobile`)
- `pnpm build` - build publishable framework packages and the web sandbox
- `pnpm test` - run framework package and web sandbox tests
- `pnpm type-check` - type-check workspace packages and apps
- `pnpm type-check:mobile` - type-check the mobile app
- `pnpm release:verify` - build, pack, and verify publishable package contents
- `pnpm changeset` - create a Changesets release note
- `pnpm sync:package-repos` - sync package source folders to their read-only mirror repos
- `pnpm sync:package-repos:dry` - print package repo sync commands without pushing

## Framework Package Flow

Framework development is source-first. The sandbox web app resolves `@southneuhof/is-data-model`, `@southneuhof/is-vue-framework`, and `@southneuhof/apostle` directly to `packages/*/src` through Vite and TypeScript aliases, so framework edits work with normal Vite HMR.

Published package consumption is build-first. The publishable packages emit to `dist`, expose only `package.json#exports`, and are configured for GitHub Packages under the `@southneuhof` scope.

Run `pnpm release:verify` before publishing or cutting a release PR. Generated `dist` output and local pack tarballs are not source artifacts.

## Package Repository Mirrors

This monorepo is the source of truth. The individual package repositories are generated mirrors of package source folders:

```txt
packages/model-meta    -> https://github.com/southneuhof/is-data-model
packages/apostle       -> https://github.com/southneuhof/apostle
packages/vue-framework -> https://github.com/southneuhof/is-vue-framework
```

Open framework issues and pull requests against this monorepo, not the mirror repositories.

Maintainers can sync mirrors manually:

```sh
pnpm sync:package-repos
```

CI also syncs mirrors from `main` through `.github/workflows/sync-package-repos.yml`. The workflow requires a `GH_PACKAGES_TOKEN` secret that can push to the three package repositories.

## Client Package Versions And Rollback

Client apps should consume immutable GitHub Packages versions, not Git commits or mirror repository branches.

Recommended client dependency style:

```json
{
  "dependencies": {
    "@southneuhof/is-data-model": "0.0.0",
    "@southneuhof/apostle": "0.0.0",
    "@southneuhof/is-vue-framework": "0.0.0"
  }
}
```

Use exact versions for production client apps while the framework is still maturing. Avoid `latest`, and avoid `^` ranges unless the client app intentionally accepts compatible automatic upgrades.

The published packages include readable `src` files for debugging and learning:

```txt
node_modules/@southneuhof/is-vue-framework/src
```

To list available versions:

```sh
npm view @southneuhof/is-vue-framework versions --registry=https://npm.pkg.github.com
```

To roll one package back:

```sh
pnpm add @southneuhof/is-vue-framework@PREVIOUS_VERSION
pnpm install
pnpm build
```

To roll the framework package set back together:

```sh
pnpm add \
  @southneuhof/is-data-model@PREVIOUS_VERSION \
  @southneuhof/apostle@PREVIOUS_VERSION \
  @southneuhof/is-vue-framework@PREVIOUS_VERSION
```

Commit the resulting `package.json` and `pnpm-lock.yaml` changes in the client app.

## GitHub Packages

This repo includes `.npmrc` registry routing for `@southneuhof`. Local consumers still need a GitHub Packages token in their user-level npm config or environment. CI publishing is handled by `.github/workflows/release.yml` with Changesets.

The release workflow requires `GH_PACKAGES_TOKEN` for `NODE_AUTH_TOKEN` because packages are linked to separate mirror repositories.

## Web App

See [apps/web/README.md](apps/web/README.md) for frontend-specific setup and runtime notes.
