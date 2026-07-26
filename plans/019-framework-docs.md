# Plan 019: Write the Sprindle reference docs and agent guide

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 694c905..HEAD -- packages/sprindle apps/api`
> This plan documents whatever has LANDED. Run it after plans 011–018 (or
> document only what exists — see STOP conditions).

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: whichever of plans 011–018 have landed (docs describe reality; execute this LAST among them)
- **Category**: docs
- **Planned at**: commit `694c905`, 2026-07-26

## Why this matters

Sprindle's entire documentation is 8 lines of README. The framework's design philosophy is a small closed vocabulary with loud boot-time errors — but the vocabulary is only discoverable by reading source. For agent-driven development (this repo's primary mode — see `plans/` history), docs are the interface: an agent that can't load the vocabulary re-invents it wrong and then fights `domain-schema.ts`'s boot validation blind. Docs teach before runtime; boot errors teach after. Cheapest leverage on the whole backend list.

## Current state

- `packages/sprindle/README.md` — 8 lines: mirror notice + "Backend framework primitives for South Neuhof information systems." Nothing else.
- Root `AGENTS.md` — entirely about the `graphify` tool; no backend guidance. No `CLAUDE.md`. `apps/api` has no README/AGENTS.md.
- The vocabulary to document (verify each against source while writing; file references as of `694c905`):
  - **entity** — `createEntity({ table, schemas })`, `defineEntitySchemas` (`model/domain-schema.ts:61-77`)
  - **domain part / domain schema** — `defineDomainPart`, `defineDomainSchema`, `bindDomainDatabase` (`domain-schema.ts:79-145`)
  - **model** — `defineModel({ path, entity, routes, ...hooks })` (`model/define-model.ts:29-47`)
  - **route** — `defineRoute`, `defineRouteFactory`, canonical kinds `list|detail|create|update|delete|custom` (`routes/define-route.ts`, `model/route-types.ts:8`)
  - **source** — `ModelSource` 6-method contract (`source/model-source.ts:17-24`), `createDrizzleSource`
  - **pipeline** — 5 hooks `before → authorize → validate → action → after` + `error`; model-level before route-level; `after` reversed (`routes/pipeline.ts:8-33`)
  - Route-tree nesting → URL segments; canonical URLs `/x/list`, `/x/detail/:id`, `/x/create`, `/x/update/:id`, `/x/delete/:id` (`model/route-tree.ts:30-31`)
  - `installSprindle` + typed RPC via `hc<AppType>` (`hono/index.ts`); packages/sdk consumes it
  - Envelopes: list `{ data, page, limit, total }`, detail/create/update `{ data }`, delete `{ ok: true }`, error `{ error, message?, issues? }` (post-012/013 shapes)
  - Post-014: `identity` option + `authenticated()` guard; post-015: `requestContext()` + logger; post-016: `testing` subpath; post-017: `openapi` subpath; post-018: migration convention
- App file conventions (exemplar: `apps/api/src/routes/products/`): `products.entity.ts` (table + schemas + entity), `products.model.ts` (defineModel), `products.routes.ts` (custom routes), `products.ts` (composition/export), registered in `src/routes/index.ts` (`domainParts` + `routes` arrays).
- House vocabulary rule (`plans/README.md`, Shared architectural invariants): names from existing/platform/plain-English vocabulary; no coined compounds; domain words never in framework APIs. The docs must state this rule for future contributors.
- The sprindle package README is mirrored to a standalone repo (`sync-package-branches.yml`) — the reference doc must live under `packages/sprindle/` so it travels with the mirror.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Types (snippets compile-checked, Step 3) | `pnpm --filter @southneuhof/sprindle type-check` | exit 0 |
| Tests | `pnpm --filter @southneuhof/sprindle test` | all pass |

## Scope

**In scope** (create/modify):
- `packages/sprindle/README.md` (expand: what it is, philosophy, 60-second example, links)
- `packages/sprindle/docs/reference.md` (create — the vocabulary reference)
- `packages/sprindle/docs/recipes.md` (create — deliberately-out-of-core recipes)
- `apps/api/AGENTS.md` (create — the agent runbook for this app)

**Out of scope**:
- Any code change (pure docs; exception: Step 3's compiled-snippet spec file).
- Root `AGENTS.md` (graphify's file — do not touch).
- Frontend docs.

## Git workflow

- Branch: `codex/plan-019-framework-docs`
- Commit: `docs(sprindle): add reference, recipes, and agent guide`

## Steps

### Step 1: `docs/reference.md`

Sections: Vocabulary (the nouns above, one section each: signature, minimal example, boot-validation errors it can raise); Request lifecycle (pipeline order diagram in text, hook signatures, state accumulation); Wire contracts (envelopes incl. error contract, list query params); Extending (custom routes, route factories, raw Hono `middleware` escape hatch, `ModelSource` for non-Drizzle backends); Design rules (thin-over-Hono, types-over-codegen, fail-loud-at-boot, the vocabulary rule quoted from `plans/README.md`). Every claim written by opening the cited source file — no copying from this plan on faith.

**Verify**: every `file:line` reference in the doc opens to the described code (spot-check 10); every claimed export exists: `grep` each documented symbol against `packages/sprindle/src/*/index.ts`.

### Step 2: README + recipes + AGENTS.md

- README: 1-paragraph pitch, philosophy bullets, one complete entity→model→install example (~40 lines), link to docs/, keep the mirror notice.
- `docs/recipes.md`: the deliberately-app-level list with a short recipe or pointer each — file upload, background jobs, caching, rate limiting (Hono middleware), health checks, CORS, audit logging via `after` hooks, seeds. One honest sentence each on WHY it's not in core.
- `apps/api/AGENTS.md`: "add a resource = create `<name>/<name>.entity.ts|.model.ts|.ts`, register in `src/routes/index.ts` (both arrays), attach `authenticated()`, run `db:generate` + `db:migrate`, verify with `pnpm --filter @southneuhof/api test`" — exact commands, exemplar pointer to `routes/products/`, and the STOP-style warning: boot-time schema errors are remediation messages, read them fully.

**Verify**: a fresh agent following AGENTS.md's steps would touch only files that exist under the described paths (walk the instructions against the tree manually).

### Step 3: Compile-check the README example

Put the README's main example verbatim in `packages/sprindle/src/__tests__/readme-example.spec.ts` (a `.spec` that type-checks and runs one assertion, e.g. list returns `{ data: [], ... }` via the testing subpath if plan 016 landed). Note in a comment: "keep in sync with README.md".

**Verify**: `pnpm --filter @southneuhof/sprindle test` → passes; `type-check` → exit 0.

## Test plan

Step 3 is the only executable artifact — it pins the README example against drift. Everything else verifies by the manual checks above.

## Done criteria

- [ ] `packages/sprindle/README.md` > 60 lines with a compiling example
- [ ] `docs/reference.md` documents all 6 nouns + pipeline + envelopes + query params
- [ ] `docs/recipes.md` covers the 8 app-level topics
- [ ] `apps/api/AGENTS.md` exists with the add-a-resource runbook
- [ ] readme-example spec passes; all commands green
- [ ] `plans/README.md` updated

## STOP conditions

- Plans 011–018 partially landed and a doc section would describe unlanded behavior — document ONLY what exists and list the gaps in your completion report (do not document the future).
- A source read contradicts this plan's vocabulary summary (drift) — document the source, note the discrepancy.

## Maintenance notes

- Every future framework plan should end with "update docs/reference.md" as a step; the readme-example spec enforces at least the README.
- Reviewer: read AGENTS.md as if executing it cold — every command must be copy-pasteable.
- Deferred: a docs site; JSDoc on public symbols (worth doing opportunistically).
