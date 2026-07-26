# @southneuhof/contracts

**This package no longer holds contracts. Do not add anything to it.**

Contracts are now two things, neither of them here:

- **Schemas** live on the API entity modules. `apps/api/src/routes/<name>/<name>.entity.ts` exports
  the Drizzle table and its Zod `create` / `update` / `select` schemas, and those modules are
  importable from a browser bundle (plan 021). A screen validates against `entity.schemas.create`
  directly — see `apps/web/src/framework/adapters/resources/roles.ts`.
- **Request and response types** are inferred, not written. `hc<AppType>` over
  `@southneuhof/api/rpc` reconstructs them from the installed route tree; `packages/sdk` is where
  that happens.

What used to live here was a hand-maintained mirror of the entity schemas, kept in step by
`apps/api/src/__tests__/schema-parity.spec.ts`, plus a stub Hono app that faked `AppType`. Plan 022
deleted both: the mirror because there is one declaration now instead of two, and the stub because
nothing imported it and it contradicted the real derivation.

The directory survives only so its workspace entry does not have to be unwound in the same change.
No app depends on it any more; deleting it is safe once nothing references the name.
