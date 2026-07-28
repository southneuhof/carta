# Plan 023: Add dynamic field presentation and safe value effects

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm expected output before continuing. Stop on
> any condition in "STOP conditions"; do not improvise. Update the status row
> in `plans/README.md` after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/contracts/fields.ts packages/is-vue-framework/src/fields packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/components/core/__tests__/form.spec.ts docs/architecture/web-application-architecture.md`
>
> Plan 022 intentionally changes `Form.vue`; execute this drift check against
> the post-022 tree and reconcile only those expected changes. Stop if field
> behavior contracts changed independently.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 022
- **Category**: direction
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

Current field behavior handles visibility, disabled state, dynamic props,
derived values, and reset cascades. It cannot atomically switch a field's
renderer/label/layout, and derived values remain user-overridable until a source
dependency changes. Unchecked value-effect cycles can also produce unstable
drafts. This plan adds restricted dynamic presentation and deterministic,
cycle-safe value effects without restoring the legacy mutable `inputConfig`
engine.

## Current state

- `contracts/fields.ts:67-74` defines separate `visible`, `disabled`, `props`,
  `derived`, and `resetWhen` behavior functions.
- `fields/behavior.ts` evaluates each option in a Vue computed and records draft
  properties read through a mutation-blocking proxy.
- `fields/behavior.ts:168-178` watches `derived` and writes it to the draft.
- `fields/__tests__/behavior.spec.ts:122-143` claims user edits are ignored but
  only asserts the computed derived value after the edit; it does not assert
  that the draft was restored before another dependency changed.
- `components/core/Form.vue:125-131` allows `setValue()` on every field.
- Hidden fields are preserved in internal draft but excluded from
  `visibleDraft`; keep this policy.
- Architecture vocabulary requires `renderer`, `behavior`, `derived`, and
  `resetWhen`; do not introduce `type`, `control`, or manual `dependsOn`.

Accepted semantics:

- Presentation may change only `renderer`, `label`, `props`, and `span`.
- Presentation changes are atomic.
- Renderer changes preserve value unless `resetWhen` clears it.
- Derived fields are canonical and non-editable.
- `resetWhen` does not clear during initial connection; later identity changes
  clear the target.
- Dependencies are inferred from reactive draft reads.
- Disabled fields remain in validation/submission; hidden fields do not.
- Value-writing cycles fail loudly.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Field tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/fields --environment jsdom` | all field tests pass |
| Form tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/form.spec.ts --environment jsdom` | all Form tests pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Diff validation | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/fields.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/contracts/__type-tests__/fields.type-test.ts`
- `packages/is-vue-framework/src/fields/behavior.ts`
- `packages/is-vue-framework/src/fields/__tests__/behavior.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `docs/architecture/web-application-architecture.md`

**Out of scope**:

- Arbitrary imperative effect callbacks.
- Async behavior or data fetching inside behavior.
- Manual dependency arrays.
- Changing field key, read/write accessors, validation, or behavior at runtime.
- Async validation; plan 024 owns it.
- Replacing resource fields after Form mount. Field definitions are immutable
  for one mounted Form; dynamic presentation covers supported runtime changes.

## Git workflow

- Branch: `codex/023-form-effects`
- Commit example: `feat(framework): add safe form field effects`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define restricted atomic presentation

Add `FieldBehaviorPresentation`:

```ts
interface FieldBehaviorPresentation {
  renderer?: string | null
  label?: string | null
  props?: Record<string, unknown> | null
  span?: number | null
}
```

Add one behavior function:

```ts
presentation?: (
  context: FieldBehaviorContext<TDraft, TValue>
) => FieldBehaviorPresentation
```

Semantics:

- result shallow-merges over resolved static form presentation;
- `undefined` inherits;
- `null` clears;
- `props` shallow-merge when object, clear when null;
- the four properties update as one computed state;
- equal presentations retain stable object/props references.

Keep `visible` and `disabled` separate. Deprecate `behavior.props` in types and
docs only if compatibility policy permits; otherwise keep it temporarily with
precedence `static props < behavior.props < presentation.props` and document
the migration. Do not silently change existing behavior.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/fields --environment jsdom`
→ tests prove atomic variant switching, null clearing, stable references, and
projected renderer/label/props/span values.

### Step 2: Render effective presentation

Extend `FieldBehaviorState` with effective presentation fields. Update Form to
render label, renderer, props, and span from behavior state rather than the
static resolved field.

Slots still receive:

- stable field identity and static definition;
- effective presentation as part of field/state slot context;
- current value, draft, error, touched, disabled, and `setValue`.

When renderer key changes, Vue must replace the renderer instance. Preserve the
draft value. Add a test switching `text` ↔ `file` (test doubles are sufficient)
and assert value preservation plus correct component replacement.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/form.spec.ts --environment jsdom`
→ dynamic presentation tests pass.

### Step 3: Make derived values canonical

For a field declaring `derived`:

- effective disabled state is always true;
- `Form.setValue()` must not modify it;
- initial connection writes the derived result synchronously;
- dependency changes synchronously update draft before validation/submission;
- programmatic submit immediately after a source update sees settled derived
  values;
- the submitted visible draft includes the derived value.

Add the missing regression assertion:

```text
write draft.total = 999
next tick
draft.total must equal canonical derived result
```

Prefer preventing the write through Form plus a synchronous runtime correction
for external/programmatic mutation. Do not rely only on disabled DOM controls.

**Verify**:
field and Form focused tests pass, including immediate programmatic submission.

### Step 4: Detect value-effect cycles

Track dependencies read by `derived` and `resetWhen` separately from
presentation-only dependencies. Build a graph where each value-effect target
points to value-effect fields it reads.

On every dependency re-evaluation:

- reject direct self-dependency;
- run cycle detection across current value-effect edges;
- throw a developer-facing error naming the cycle, for example
  `a -> b -> a`;
- do not partially apply the write that discovered the cycle.

Conditional branches may change dependencies; replace old edges with the latest
observed set before checking. Presentation-only cycles are harmless computed
reads and must not be rejected unless they include a value-writing effect.

Add tests for:

- self-derived field;
- two derived fields;
- derived/reset cycle;
- long acyclic derived cascade;
- conditional dependency graph changing without stale edges.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run src/fields --environment jsdom`
→ all cycle and cascade tests pass.

### Step 5: Define deterministic reset ordering

Keep `resetWhen` identity semantics:

- first evaluation establishes baseline and performs no reset;
- identity change clears target to `undefined`;
- reset cascades settle synchronously;
- no duplicate writes when identity remains `Object.is` equal;
- reset then derived/presentation recomputation completes before validation.

Expose a synchronous `settle()` or equivalent internal guarantee from behavior
runtime. `Form.validate()` and `Form.submit()` must invoke/observe that guarantee
before taking the visible draft snapshot.

**Verify**:
Form test performs source update and immediate submit without `nextTick`; submit
receives reset/derived settled data.

### Step 6: Update architecture documentation

Document:

- atomic `behavior.presentation`;
- restricted presentation keys;
- derived read-only semantics;
- reset identity semantics;
- hidden versus disabled payload behavior;
- automatic dependencies and cycle rejection;
- ban on arbitrary imperative/async behavior.

**Verify**:
`rg -n "presentation|cycle|Derived fields" docs/architecture/web-application-architecture.md`
→ all concepts appear.

## Test plan

Use `fields/__tests__/behavior.spec.ts` for runtime behavior and
`components/core/__tests__/form.spec.ts` for rendering/submission integration.
Cover:

- atomic text/file presentation variants;
- null clearing and static merge precedence;
- renderer replacement with value preservation;
- derived UI and programmatic edit rejection;
- immediate submit settlement;
- reset cascade;
- direct, indirect, and conditional cycles;
- hidden omitted, disabled included.

## Done criteria

- [ ] Dynamic presentation atomically changes renderer, label, props, and span.
- [ ] Runtime presentation cannot alter field identity/access/validation.
- [ ] Derived fields cannot be overridden through UI or programmatic draft mutation.
- [ ] Derived/reset cascades settle before validation and submission.
- [ ] Value-effect cycles throw with named paths.
- [ ] Hidden fields are omitted; disabled fields remain present.
- [ ] No manual dependency lists or arbitrary imperative effects exist.
- [ ] Focused tests, package tests, and typecheck pass.
- [ ] `git diff --check` returns no output.
- [ ] `plans/README.md` marks plan 023 DONE after implementation and review.

## STOP conditions

Stop and report if:

- Correct derived settlement requires asynchronous polling or arbitrary retry
  counts rather than dependency/cycle logic.
- Vue cannot replace dynamic renderer instances while preserving value.
- Compatibility requires runtime replacement of field keys or write accessors.
- Existing consumers mutate behavior objects after mount.

## Maintenance notes

- Reviewers should scrutinize cycle detection under conditional dependencies.
- Keep presentation pure. Fetching remote options belongs in renderer/runtime
  services driven by presentation props, not behavior callbacks.
- Future behavior keys must be classified explicitly as presentation-only or
  value-writing before addition.

