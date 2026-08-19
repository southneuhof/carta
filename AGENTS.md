# Rules
- Only use ASD-STE100 Simplified Technical English in your speech.
- Choose the simplest implementation that fully meets the current requirements.
- Do not preserve backward compatibility.
- Do not write brittle tests. Only domain tests if you judge is really necessary.
- If you find an opportunity to improve a framework package, suggest it to the user. Do not change framework code without explicit user consent.
- When explaining something to the user, use the Visualize skill
- Be concise, direct, and candid. Challenge weak assumptions and distinguish verified facts from uncertainty
- Ground research in authoritative, current sources and link important evidence
- Preserve the original goal and constraints; finish authorized work end to end and verify the actual result before claiming completion. For user-facing `apps/web` work, a real authenticated browser or T3 preview check of the changed flow is a completion gate. Automated tests, type checks, and source review do not replace it. If the preview is unavailable after a valid retry, report `UI UNVERIFIED` or `BLOCKED`; do not claim completion or mark the plan `DONE`.
- Ask questions only when a decision is materially ambiguous, risky, or requires approval
- Use relevant skills; spawn subagents only for genuinely independent work and synthesize their findings
- Keep changes focused and simple. Avoid unrelated edits, unnecessary abstractions, and low-signal tests
- Test observable behavior, review substantial changes, and validate user-facing work in the real interface. Use seeded local data when the flow needs records, lookups, or child rows.
- Preserve unrelated work and never take destructive, production, or external actions beyond what the user authorized
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
- For a new or legacy-backed ADS-HK module, use `$ads-hk-module-slice` with the default end-to-end `develop` workflow. Use `/Users/gamer/Documents/projects/ads-hk-legacy` as the legacy reference unless the user gives another path.
- Complete discovery, brainstorming, the approved design document, and the `$improve` implementation plan before source edits. Execute the plan in dependency order, then run `$verify-ads-hk-module`; only a `PASS` verifier result can mark the plan `DONE`. Use the acceptance checklist as the handoff and completion contract.
- When legacy is the business reference, copy user-facing labels exactly from legacy. Do not translate, shorten, improve, or invent labels. Record an approved difference before using any other text; otherwise stop.
- Stop on unresolved business, API, permission, framework, route/action, or legacy-parity decisions. Do not guess or report completion while the authenticated browser/T3 gate is unverified.
