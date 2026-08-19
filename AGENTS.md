# Rules
- Only use ASD-STE100 Simplified Technical English in your speech.
- Choose the simplest implementation that fully meets the current requirements.
- Do not preserve backward compatibility.
- Do not write brittle tests. Only domain tests if you judge is really necessary.
- If you find an opportunity to improve a framework package, suggest it to the user. Do not change framework code without explicit user consent.
- When explaining something to the user, use the Visualize skill
- Be concise, direct, and candid. Challenge weak assumptions and distinguish verified facts from uncertainty
- Ground research in authoritative, current sources and link important evidence
- Preserve the original goal and constraints; finish authorized work end to end and verify the actual result before claiming completion. For user-facing `apps/web` work, a real authenticated Codex browser check of the changed flow is a completion gate. Automated tests, type checks, and source review do not replace it. If the browser is unavailable after a valid retry, report `UI UNVERIFIED` or `BLOCKED`; do not claim completion or mark the plan `DONE`.
- Ask questions only when a decision is materially ambiguous, risky, or requires approval
- Use relevant skills; spawn subagents only for genuinely independent work and synthesize their findings
- Keep changes focused and simple. Avoid unrelated edits, unnecessary abstractions, and low-signal tests
- Test observable behavior, review substantial changes, and validate user-facing work in the real interface. Use seeded local data when the flow needs records, lookups, or child rows.
- Preserve unrelated work and never take destructive, production, or external actions beyond what the user authorized
- For an authenticated browser check against local or development ADS-HK data, temporary fixtures required by the approved module journey are pre-authorized. Create only clearly marked temporary records, keep their identifiers, update and reload them as required, delete them after the check, and reload to confirm removal. Do not ask for confirmation again. This does not authorize production or external writes, changes to seeded/reference/existing-user records, or irreversible business actions.
- For module acceptance, use the module-scoped commands from the selected plan or `verify:module`. Do not run a package-wide `test`, `test:unit`, or bare `vitest run` as the default. Run a full suite only when a focused failure shows a cross-module risk or the user asks for it, and record the reason.
- Report meaningful blockers, outcomes, and evidence without noisy progress

# Web UI reuse
- For `apps/web` UI work, use `.agents/skills/web-ui-surface-reuse/SKILL.md`; do not load it for backend or architecture-only work.
- For `apps/web` UI work, read `docs/architecture/web-application-architecture.md`, `packages/is-vue-framework/README.md`, and the nearest route/resource first.
- Use `defineResource` + `ListView`/`DetailView`/`FormView` for standard CRUD; use `Table`/`Detail`/`Form`, `defineFields`, and package components for custom surfaces.
- Before editing a route, record the exact route and surface (`list`, `detail`, `row`, `form`, or shared component), its intended actions, and the sibling pattern. Do not remove or rename an action on another surface because it uses the same component or label.
- Use the framework standard action for standard CRUD. Add a custom control only when the standard surface cannot express the requirement; record the exact gap and get approval when the change affects a shared package.
- Do not create generic local components or custom inputs, tables, forms, or dialogs when `@southneuhof/is-vue-framework` has an equivalent. Local components are for navigation, app shell, or domain workflows.
- If no equivalent fits, record the exact gap, keep code route-local, and do not edit framework code without explicit approval. Summaries must state `Reused`, `Searched`, and `Gap`.

## Module development
- For a new or legacy-backed ADS-HK module, use `$ads-hk-module-slice` with the default end-to-end `develop` workflow. Start with exact-identifier shape triage and a small evidence ledger. Use `/Users/gamer/Documents/projects/ads-hk-legacy` as the legacy reference unless the user gives another path.
- Use the bounded manifest path only when direct evidence proves standard CRUD and no decision remains unresolved. Use `$brainstorming`, an approved design, and the `$improve` implementation plan for relation-backed, workflow, custom-surface, or unclear modules. Execute the plan in dependency order, then run `$verify-ads-hk-module`; only a `PASS` verifier result can mark the plan `DONE`. Use the acceptance checklist as the handoff and completion contract.
- When legacy is the business reference, copy user-facing labels exactly from legacy. Do not translate, shorten, improve, or invent labels. Record an approved difference before using any other text; otherwise stop.
- Stop on unresolved business, API, permission, framework, route/action, or legacy-parity decisions. Do not guess or report completion while the authenticated Codex browser gate is unverified.

### Simple master-data workflow
- Use the bounded simple-master-data fast path only after direct discovery and legacy evidence are complete and a bounded decision record proves that no business, API, permission, route/action, or framework decision remains unresolved. Do not require the full brainstorming and design cycle when the bounded contract is already clear; escalate to that cycle as soon as the evidence is ambiguous or complex.
- Use one explicit `kind: "simple-master-data"` manifest per module. It must define the identity, every domain field, exact labels, six permission entries, navigation placement, and optional seed records. The scaffold never invents `name`, `description`, `active`, `code`, audit, relation, or seed fields.
- The module must use standard CRUD only. It must have no child relation, lookup consumer, workflow transition, custom API operation, or framework change. Nested or relation-backed work must use the normal end-to-end workflow.
- Run these commands in order. The JSON output gives absolute generated, integration, and manual paths:
  ```sh
  pnpm scaffold:master-data --config /absolute/path/module.json --json
  pnpm integrate:master-data --manifest /absolute/path/module.json --check
  pnpm integrate:master-data --manifest /absolute/path/module.json --apply
  pnpm --silent verify:module --manifest /absolute/path/module.json --check-only --json
  pnpm --silent verify:module --manifest /absolute/path/module.json --run --json
  ```
- Capture the JSON result from the check and run commands as the named machine
  report for the module. The independent verifier consumes a fresh report and
  reruns a command only when the report is missing, stale, failed, or does not
  cover a required risk.
- The focused test commands must include the module's API and web spec paths.
  Do not replace them with a package-wide suite.
- Use `--with-seed` with `verify:module --run` only when the manifest has seed records. The integration command is guarded and idempotent; do not edit route-map files by hand.
- The full acceptance checklist, authenticated Codex browser check, and `$verify-ads-hk-module` `PASS` remain mandatory. Reuse the same worker, session, and browser context for a safe sequence of simple modules when possible.
- Use High or Extra High reasoning only for this workflow (`high` or `xhigh` in model control). Never use Low or Medium. Max-level effort remains optional for complex modules.
