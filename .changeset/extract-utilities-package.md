---
"@southneuhof/utilities": minor
"@southneuhof/is-vue-framework": major
"@southneuhof/framework-web": patch
---

Extract framework utility modules into the new `@southneuhof/utilities` package.

### Breaking changes

- Remove `@southneuhof/is-vue-framework/utils/*` exports.
- Migrate all utility imports to `@southneuhof/utilities/*`.

### Added

- New publishable package `@southneuhof/utilities` with utility modules and tests moved from `@southneuhof/is-vue-framework`.
- Monorepo release and sync tooling now includes `@southneuhof/utilities` and repository sync to `https://github.com/southneuhof/utilities`.
