# Plan 038: Migrate Location and MultiLocation to explicit map operations

> **Implementation instructions:** Preserve current Google Maps UI and coordinate
> model. Replace framework runtime access with explicit operations, cancellation,
> and deterministic errors. MultiLocation must forward the same operations to
> every nested LocationInput.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/components/composites/form-inputs/LocationInput.vue packages/is-vue-framework/src/components/composites/form-inputs/MultiLocationInput.vue packages/is-vue-framework/src/contracts apps/web/src/framework/adapters/location.ts apps/web/src/routes`

## Status

- **Priority:** P1
- **Effort:** M
- **Risk:** MED
- **Depends on:** 035
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

LocationInput currently assumes global Google backend operations, allows stale
autocomplete/detail responses to win, and can remain loading after rejection.
Explicit operations keep map vendor/backend knowledge in app code and make
failure/cancellation behavior testable. MultiLocation currently cannot configure
its nested inputs independently of global runtime.

## Target contract

Use typed, backend-neutral UI records:

```ts
interface Coordinate {
  lat: number
  lng: number
  formatted_address?: string
}

interface LocationPrediction {
  id: string
  primaryText: string
  secondaryText?: string
}

interface LocationOperations {
  autocomplete(context: { input: string; signal?: AbortSignal }): MaybePromise<readonly LocationPrediction[]>
  detail(context: { id: string; signal?: AbortSignal }): MaybePromise<Coordinate>
  mapConfig(context: { signal?: AbortSignal }): MaybePromise<{ apiKey: string }>
}
```

Names may match repo conventions, but framework component must not expose Google
`place_id`, `structured_formatting`, or backend endpoint fields.

## Current state

- `LocationInput.vue:4,34` reads `FrameworkRuntime`.
- `LocationInput.vue:64-83` manually fetches detail/autocomplete, lacks
  `try/finally`, and does not cancel stale requests.
- `LocationInput.vue:85-93` handles geolocation success only.
- `LocationInput.vue:95-97` fires autocomplete for every query change with no
  clear/abort behavior.
- `LocationInput.vue:107-109` top-level awaits global map config.
- Template lines `125-133` reads Google response fields directly.
- `MultiLocationInput.vue:39,58` mounts nested LocationInput without operations.
- `apps/web/src/framework/adapters/location.ts:3-19` is correct place to map
  Google/backend envelopes into framework-neutral predictions/coordinates.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Location tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/composites/__tests__/LocationInput.spec.ts src/components/composites/__tests__/MultiLocationInput.spec.ts` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Runtime audit | `rg -n "useFrameworkRuntime|missingRuntimeCapability|runtime\\.location|place_id|structured_formatting" packages/is-vue-framework/src/components/composites/form-inputs/{LocationInput,MultiLocationInput}.vue` | no matches |

## Scope

**In scope**

- `LocationInput.vue`
- `MultiLocationInput.vue`
- Location contract file under `packages/is-vue-framework/src/contracts/`
- Component tests.
- `apps/web/src/framework/adapters/location.ts` and its tests.
- Web field/catalog callers needing explicit operations.

**Out of scope**

- Replacing `vue3-google-map` or changing map visual layout.
- Reverse geocoding map clicks.
- MultiLocation collection UX redesign.
- Runtime type removal until plan 042.
- Global geolocation permission UX outside this input.

## Git workflow

- Branch: `codex/038-location-operations`
- Suggested commits:
  1. `refactor(framework): inject location operations`
  2. `refactor(web): normalize map operations`

## Steps

### Step 1: Define neutral contracts and fixtures

Add prediction, coordinate, config, and operation types. Export public types from
contracts. Add test fixtures with neutral `id/primaryText/secondaryText`.

**Verify:** framework typecheck passes; type tests reject Google-specific
prediction access in component-facing contract.

### Step 2: Migrate map config loading

Accept required operations as one prop or explicit function props. Load config
through `useLoader` because it is a read. Use a stable per-instance/cache key;
show loading/error instead of rejecting top-level setup. Do not mount GoogleMap
until API key exists.

**Verify:** tests cover pending, success, normalized error, and unmount
cancellation.

### Step 3: Migrate autocomplete and detail reads

Drive autocomplete through reactive query key/context so new input aborts old
request. Clear predictions when input becomes empty. Ignore results from
operations that do not honor abort by checking request generation before
committing UI state.

Detail selection similarly aborts/supersedes older detail request. Always clear
loading in `finally`; keep previous coordinate when detail fails. Emit
`validation:touch` only after successful coordinate change.

**Verify:** deferred-response tests resolve older request last and prove it
cannot overwrite latest state.

### Step 4: Handle geolocation and direct map interaction

Add geolocation error callback and unsupported-browser branch. Surface an input
error/toast using existing framework pattern. Prevent exceptions from leaving
loading state. Preserve click and drag coordinate semantics and touch emission.

**Verify:** tests mock success, denied permission, unavailable API, map click,
and marker drag.

### Step 5: Forward operations through MultiLocation

Give MultiLocation same operation prop shape and pass it to both add/edit nested
LocationInput instances. Preserve array model behavior. Add missing touch
emission for add/edit only if core Form already expects it and tests confirm no
breaking emission order.

**Verify:** nested component test asserts exact operation object/functions are
forwarded for both paths.

### Step 6: Normalize web adapter and callers

Map backend Google payloads to neutral predictions in
`apps/web/src/framework/adapters/location.ts`. Thread `AbortSignal` into service
requests. Pass operation object/closures from resource or app composition root;
do not restore a global location capability fallback.

**Verify:** adapter unit tests assert envelope normalization and signal
forwarding; full gates pass.

## Test plan

- `LocationInput.spec.ts`: config states, autocomplete cancellation/stale guard,
  detail cancellation/stale guard, clear query, geolocation failure, click/drag,
  touch emission.
- `MultiLocationInput.spec.ts`: operation forwarding and add/edit model.
- Adapter tests: Google fields converted at app boundary.
- Stub GoogleMap/Marker; no external script/network.

## Done criteria

- [ ] Framework component contracts contain no Google response shape.
- [ ] No runtime access in either component.
- [ ] Reads cancel and stale results cannot commit.
- [ ] All loading paths finalize.
- [ ] Geolocation failures surface safely.
- [ ] MultiLocation forwards operations.
- [ ] Package/web tests and typechecks pass.

## STOP conditions

- `vue3-google-map` requires API key before component can render any testable
  fallback and fixing it needs library replacement.
- App service layer cannot accept cancellation without broad unrelated rewrite.
- Existing consumers require a different coordinate model.
- MultiLocation mutation semantics conflict across live callers.

## Maintenance notes

Vendor-specific response normalization belongs in app adapter. If another map
provider arrives, add another app adapter against same contracts. Consider input
debounce later only as UX policy; cancellation/stale correctness must not depend
on debounce.

