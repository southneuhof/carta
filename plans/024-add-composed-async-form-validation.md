# Plan 024: Add composed synchronous and asynchronous form validation

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm expected output before proceeding. Stop and
> report on any "STOP condition"; do not improvise. Update `plans/README.md`
> after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/contracts packages/is-vue-framework/src/validation packages/is-vue-framework/src/components/core/Form.vue packages/is-vue-framework/src/resources/defineResource.ts packages/is-vue-framework/src/components/views/FormView.vue`
>
> Plans 022 and 023 intentionally touch several paths. Reconcile their expected
> final state before implementation. Stop if another validation API landed.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans 022 and 023
- **Category**: direction
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

Resource Zod schemas already validate create/update drafts, but custom rules can
depend on runtime context or remote services and cannot always live in a static
schema. Current validation is synchronous, blur exposes unrelated untouched
errors, root issues are invisible, and no cancellation protects remote checks
from stale results. This plan composes Zod with sync/async custom validators,
adds deterministic cancellation and pending state, and completes accessible
validation UX.

## Current state

- `contracts/validation.ts` defines synchronous `ValidationSchema.validate()`.
- `validation/zod.ts` adapts Zod `safeParse()` into that contract and preserves
  parsed/transformed output.
- `validation/select.ts:69-75` validates the visibility-filtered draft.
- `components/core/Form.vue:121-144` stores one issues array, displays issues
  without touched gating, and runs whole-form validation on touch.
- `components/core/Form.vue:151-157` focuses the first field issue but has no
  root/form issue display.
- `resources/defineResource.ts:490-529` selects create/update schemas and wires
  native Form props.
- `FormProps` has no validators or stable context.

Accepted decisions:

- Zod runs first; custom validators receive parsed data only after Zod success.
- Custom validators may be synchronous or asynchronous.
- Default triggers are blur and submit, not every keystroke.
- A newer run aborts the older run; stale results never render.
- Submit waits for validation and is disabled while relevant validation runs.
- A remote rejection becomes field/root issues; network/server failure becomes
  a form-level error and blocks submission.
- Backend submission validation remains authoritative.
- Before submit, display touched-field errors only; after a submit attempt,
  display all issues.
- Root issues render in a form summary.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Validation tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/validation --environment jsdom` | all validation tests pass |
| Form tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/core/__tests__/form.spec.ts --environment jsdom` | all Form tests pass |
| Resource/view tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/resources src/components/views --environment jsdom` | all selected tests pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Diff validation | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/validation.ts`
- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/contracts/resource.ts`
- `packages/is-vue-framework/src/contracts/fields.ts` only for validator context
- `packages/is-vue-framework/src/contracts/index.ts`
- relevant contract type tests
- `packages/is-vue-framework/src/validation/select.ts`
- `packages/is-vue-framework/src/validation/index.ts`
- `packages/is-vue-framework/src/validation/__tests__/validation.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `packages/is-vue-framework/src/components/core/__tests__/form.spec.ts`
- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/components/views/FormView.vue`
- FormView type/runtime tests
- `docs/architecture/web-application-architecture.md`
- `docs/architecture/resource-migration-guide.md`

**Out of scope**:

- Change-triggered remote validation and debounce UI.
- Server implementation for password/card checks.
- Caching remote validation results.
- Treating client remote validation as authorization or final authority.
- Per-renderer validation rules.
- Legacy `props.validation`.

## Git workflow

- Branch: `codex/024-async-form-validation`
- Commit example: `feat(framework): add async form validators`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define validator contracts

Add:

```ts
type FormValidationTrigger = 'blur' | 'submit'

interface FormValidatorContext<TData, TRaw = Partial<TData>> {
  data: TData
  draft: TRaw
  initial: Partial<TData>
  context: FieldContext
  field?: string
  signal: AbortSignal
}

type FormValidatorResult =
  | void
  | ValidationIssue
  | readonly ValidationIssue[]

type FormValidator<TData> = (
  context: FormValidatorContext<TData>
) => MaybePromise<FormValidatorResult>

interface FormValidatorDefinition<TData> {
  validate: FormValidator<TData>
  triggers?: readonly FormValidationTrigger[]
  path?: readonly (string | number)[]
}
```

Accept plain functions as shorthand for definitions with triggers
`['blur', 'submit']` and no declared pending path.

Add to `FormPropsBase`:

- `validators?: readonly (FormValidator | FormValidatorDefinition)[]`
- `context?: FieldContext`

Extend form renderer context and control slot context with field/form validation
pending state. Names must use `validating`, not `loading`, to avoid conflating
initial load, submit, and validation.

**Verify**:
package typecheck passes and type tests cover function shorthand, configured
triggers/path, async return, and invalid result shapes.

### Step 2: Compose Zod and custom validation

Make draft validation asynchronous at the orchestration boundary while retaining
the synchronous Zod bridge internally:

1. settle field effects;
2. take visibility-filtered raw draft;
3. run schema validation;
4. if schema fails, return its issues without calling typed validators;
5. if schema succeeds, run validators matching the trigger;
6. normalize void/single/array results;
7. return parsed schema data plus custom issues.

Custom validators receive Zod-parsed `data`, raw visible `draft`, stable
`initial`, caller `context`, current touched field for blur, and signal.
Submission receives parsed/transformed data, never raw input.

Run matching validators concurrently with `Promise.all`, but preserve declaration
order when flattening issues. A thrown validator error is not a validation
rejection: normalize it as a form-level operational error and block submission.

**Verify**:
validation tests cover sync success/failure, async success/failure, Zod failure
skipping custom validators, transforms/defaults reaching validators and submit,
issue ordering, and thrown errors.

### Step 3: Add cancellation and stale-result protection

Form owns an `AbortController` and monotonic validation run ID:

- starting any validation aborts the prior run;
- aborted validators do not publish issues or operational errors;
- only latest run may mutate UI state;
- unmount aborts active validation;
- submit waits for its run;
- repeated submit while submitting/validating does not duplicate requests.

Track:

- form-wide `validating`;
- pending field paths declared by active validator definitions;
- form-level pending for shorthand validators or definitions without path.

Add fake deferred-promise tests proving an older remote rejection cannot replace
a newer success, and unmount aborts the signal.

**Verify**:
Form focused tests pass with no unhandled promise rejections.

### Step 4: Complete validation visibility and accessibility

Maintain `submitAttempted`.

Issue visibility:

- before submit: a field issue renders only when its first path segment is
  touched;
- after submit attempt: every visible field issue renders;
- hiding a field clears its touched state and displayed issue;
- root issues (`path: []`) render in an accessible form summary;
- operational validator failures render in the same form-level area but remain
  distinguishable from schema/custom rejection;
- first visible invalid field is focused after failed submit;
- root-only failure focuses the summary.

Pass `validating` to renderers and slots. Disable default submit while loading,
validating, submitting, or globally disabled.

**Verify**:
Form tests cover untouched sibling errors, submit-all behavior, root-only issue,
hidden issue removal, field pending state, and focus behavior.

### Step 5: Wire validators and context through resources

Add operation-specific resource validators:

```ts
validators?: {
  create?: readonly FormValidator<TCreate>[]
  update?: readonly FormValidator<TUpdate>[]
}
```

Allow create/update form factory arguments to carry stable `context`. The
factory passes:

- create validators/schema for `form()` / no ID;
- update validators/schema for `form({ id })`;
- supplied context to Form props.

Update `FormView` form options and exact overloads. Keep Form and FormView free
of CRUD mode props; resource factory remains operation selector.

Add resource tests proving correct validator list and context for create versus
update.

**Verify**:
resource/view focused tests and type tests pass.

### Step 6: Document remote validation safety and usage

Document a resource example with an async validator. State explicitly:

- use application/backend endpoints for sensitive password/card checks;
- honor `AbortSignal`;
- avoid sending validation requests on every keystroke by default;
- backend submission repeats authoritative validation;
- thrown network errors block submission as form-level errors;
- validator results use issue paths.

Do not include real secrets, card data, or executable misuse examples.

**Verify**:
`rg -n "AbortSignal|async validator|authoritative" docs/architecture docs/architecture/resource-migration-guide.md`
→ documentation contains all three concepts.

## Test plan

Add tests for:

- sync custom field and root issues;
- async custom field and root issues;
- parsed Zod values reaching custom validators and submit;
- Zod failure skipping custom validators;
- blur triggers and untouched sibling suppression;
- submit triggers and all-error visibility;
- remote pending state;
- cancellation, stale result, and unmount;
- thrown network/server error normalization;
- resource create/update validator selection and context;
- hidden fields omitted, disabled fields included;
- effect settlement before validator execution.

Use deferred promises and fake validators; no network calls.

## Done criteria

- [ ] Zod remains first validation layer and source of parsed submit data.
- [ ] Sync and async custom validators compose after successful Zod parsing.
- [ ] Default custom triggers are blur and submit.
- [ ] New validation runs cancel old runs; stale results cannot render.
- [ ] Submit waits for validation and cannot duplicate requests.
- [ ] Touched/all/root issue UX matches accepted policy.
- [ ] Resource create/update validators and stable context wire correctly.
- [ ] Sensitive remote validation guidance preserves backend authority.
- [ ] Focused tests, package tests, package/web typechecks pass.
- [ ] `git diff --check` returns no output.
- [ ] `plans/README.md` marks plan 024 DONE after implementation and review.

## STOP conditions

Stop and report if:

- Existing `ValidationSchema` implementations require asynchronous
  `schema.validate()` itself; this plan assumes async begins at composition.
- Abort semantics cannot prevent stale state without changing renderer APIs
  beyond pending fields.
- Runtime context requires importing router/store/application state into core.
- Remote validator implementation requires handling raw payment credentials in
  framework code.
- FormView overloads lose exact create/update input typing.

## Maintenance notes

- Remote validation improves feedback only. Review every backend submit path for
  authoritative validation.
- Future change-triggered validation needs a separate debounce/caching design;
  do not bolt timers onto this runtime.
- Review cancellation paths and pending cleanup carefully. These are common
  sources of stale UI and permanently disabled submit controls.

