# Note: Hono RPC runtime approaches we rejected

Date: 2026-07-27

This note records explored approaches so the next discussion can search new ground instead of
repeating them. It is not an implementation plan and recommends no solution.

## What we want

The ideal application code remains:

```ts
const operations = createHonoResourceOperations(rpc.roles)

defineResource({
  operations: {
    ...operations,
    list: customList,
  },
})
```

Required properties:

- exact request and response types still come from Hono RPC;
- runtime capabilities contain only endpoints that really exist;
- ordinary object spread and overrides keep working;
- no code generation or generated manifest;
- no manually listed endpoints, methods, or capability flags;
- no additional contract or metadata layer developers must create or maintain;
- framework core remains backend-neutral;
- applications with other backends may still define operations and types manually.

## Root problem

TypeScript knows which Hono endpoints exist, but those types disappear at runtime.

Hono's `hc()` client is a universal JavaScript `Proxy`. Reading any property returns another
callable proxy—even when the endpoint does not exist:

```ts
rpc.users.create
rpc.users.notReal
rpc.users.notReal.anything.$post
```

All appear to exist at runtime. Therefore truthiness checks, `in`, `Object.keys()`,
`Reflect.ownKeys()`, `$url`, another wrapper proxy, or patching the global `Proxy` cannot discover
the TypeScript route keys. Runtime needs route information from somewhere else.

## Approaches discussed and rejected

### 1. Inspect the existing Hono parent proxy

```ts
createHonoResourceOperations(rpc.roles)
```

The helper checks `route.list`, `route.create`, and similar properties.

Rejected because every property is truthy and callable. A read-only resource incorrectly appears
to support full CRUD and may send requests to nonexistent paths.

### 2. Explicitly select endpoint functions

```ts
createHonoResourceOperations({
  list: rpc.roles.list.$get,
  detail: rpc.roles.detail[':id'].$get,
  create: rpc.roles.create.$post,
})
```

This is technically correct: object keys are runtime capability truth and endpoint values retain
their exact types.

Rejected because developers must repeat every supported operation. This loses too much of Hono
RPC's convenience and feels like another manifest.

Capability arrays and boolean maps are the same rejected idea in a different shape:

```ts
createHonoResourceOperations(rpc.roles, ['list', 'detail', 'create'])
```

### 3. Use resource `actions` to select lazy Hono operations

`createHonoResourceOperations(rpc.roles)` returns a lazy provider. `defineResource()` materializes
only operation keys already declared in `actions`.

Rejected because `actions` gains a second responsibility: it stops being only UI
navigation/permission truth and also becomes transport capability truth. An operation hidden from
the UI would also disappear from the resource runtime.

### 4. Hide a lazy provider inside an enumerable symbol

The Hono helper returns a special wrapper. Object spread copies a hidden symbol carrying the
provider, then `defineResource()` resolves it from `actions` and applies explicit overrides.

This preserves:

```ts
{
  ...createHonoResourceOperations(rpc.roles),
  list: customList,
}
```

Rejected because it is too magical and still depends on `actions` as runtime selection. The wrapper
is not a normal object: `Object.keys()`, serialization, cloning, and combining multiple providers
have surprising behavior.

### 5. Create all CRUD functions and filter them later

The helper creates list/detail/create/update/delete wrappers for every Hono route. The resource uses
`actions` to decide which ones count.

Rejected because the runtime object lies. Unsupported methods physically exist and can make invalid
requests even if normal UI controls hide them.

### 6. Patch or replace Hono's proxy

A custom proxy could implement enumeration or change Hono's property behavior.

Rejected because changing the proxy does not create missing route metadata. It still needs an
endpoint list, generated data, a shared runtime contract, or network discovery. The problem merely
moves.

### 7. Add a browser-safe shared runtime route contract

Server and client could consume one plain route-description object. The client could then build
ordinary objects with real keys.

Rejected under current constraints because existing API model modules contain server handlers and
DB imports. Making them browser-safe requires splitting contracts from implementations or adding
another maintained contract layer. Developers would inherit another architectural responsibility.

### 8. Discover routes from `/openapi.json` at application startup

The SDK could fetch the existing OpenAPI document, build a concrete non-proxy client, and cast it to
Hono's inferred client type.

This needs no generated file and no per-resource metadata.

Rejected because RPC initialization becomes asynchronous and requires an API metadata request before
the application can finish loading. API availability, caching, offline behavior, startup errors,
and top-level-await compatibility become new system concerns.

### 9. Generate runtime metadata

A build plugin, TypeScript transformer, or generated manifest could preserve route keys.

Excluded from consideration because the chosen constraints explicitly prohibit code generation.

## Resolution accepted after this note

The original requirements were mutually incompatible. The accepted replacement deliberately drops
one requirement: a Hono-derived JavaScript operation object does **not** have runtime-exact
enumerable keys.

Plan 037 now separates three truths:

- Hono's parent-route **type** provides exact operation autocomplete, request/response inference,
  and `vue-tsc`/build errors;
- resource `actions` remain runtime UI target/permission/visibility truth and never select or
  materialize transport operations;
- the API remains runtime route and authorization enforcement.

`createHonoResourceOperations(rpc.roles)` returns a normal spreadable object whose runtime
implementation contains all five conventional wrappers, while its mapped public type exposes only
operations present in `typeof rpc.roles`. Framework code removes `ResourceCapabilities` and never
enumerates this object. An operation may exist without an action; an action without a typed
operation is a compile error.

The accepted tradeoff is explicit: `Object.keys`, reflection, serialization, `any`, and unsafe casts
cannot discover or safely invoke Hono capabilities. Code that bypasses types may call an unsupported
wrapper and receive the server's normal error. This is already possible through raw `hc()` and does
not become framework capability truth.

See `plans/037-add-optional-hono-resource-tools.md` for the implementation contract and
`plans/038-split-resource-definitions-and-derive-types.md` for the application migration.

## Original remaining question

We need a runtime source of real endpoint keys that is simultaneously:

- already available synchronously in the browser;
- derived from the authoritative API;
- not a proxy;
- not generated;
- not fetched during startup;
- not declared or maintained separately by developers.

No discussed approach provides that source. The accepted resolution does not claim otherwise; it
removes the need for that runtime source by moving transport availability to TypeScript and UI
availability to actions.
