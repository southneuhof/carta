/**
 * This package no longer holds contracts.
 *
 * Contracts are now the API entity modules themselves — `apps/api/src/routes/<name>/<name>.entity.ts`
 * exports the authoritative Drizzle table and its Zod `create` / `update` / `select`
 * schemas, and those modules are browser-importable (plan 021). Request and response
 * *types* come from `hc<AppType>` inference over `@southneuhof/api/rpc`.
 *
 * What lived here was a hand-maintained mirror of those schemas plus a stub Hono app
 * that faked `AppType`. Both were removed by plan 022: the mirror because there is now
 * one declaration instead of two, and the stub because nothing imported it and it
 * contradicted the real derivation.
 *
 * The package is kept only so its workspace entry and path aliases do not have to be
 * unwound in the same change. Do not add anything here — put schemas on the entity and
 * import them.
 */
export {}
