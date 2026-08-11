# Rules
- Only use ASD-STE100 Simplified Technical English in your speech.
- Choose the simplest implementation that fully meets the current requirements.
- Do not preserve backward compatibility.
- Do not write brittle tests. Only domain tests if you judge is really necessary.
- If you find an opportunity to improve a framework package, suggest it to the user. Do not change framework code without explicit user consent.
- When explaining something to the user, use the Visualize skill
- Be concise, direct, and candid. Challenge weak assumptions and distinguish verified facts from uncertainty
- Ground research in authoritative, current sources and link important evidence
- Preserve the original goal and constraints; finish authorized work end to end and verify the actual result before claiming completion
- Ask questions only when a decision is materially ambiguous, risky, or requires approval
- Use relevant skills; spawn subagents only for genuinely independent work and synthesize their findings
- Keep changes focused and simple. Avoid unrelated edits, unnecessary abstractions, and low-signal tests
- Test observable behavior, review substantial changes, and validate user-facing work in the real interface when applicable
- Preserve unrelated work and never take destructive, production, or external actions beyond what the user authorized
- Report meaningful blockers, outcomes, and evidence without noisy progress

# Web UI reuse
- For `apps/web` UI work, use `.agents/skills/web-ui-surface-reuse/SKILL.md`; do not load it for backend or architecture-only work.
- For `apps/web` UI work, read `docs/architecture/web-application-architecture.md`, `packages/is-vue-framework/README.md`, and the nearest route/resource first.
- Use `defineResource` + `ListView`/`DetailView`/`FormView` for standard CRUD; use `Table`/`Detail`/`Form`, `defineFields`, and package components for custom surfaces.
- Do not create generic local components or custom inputs, tables, forms, or dialogs when `@southneuhof/is-vue-framework` has an equivalent. Local components are for navigation, app shell, or domain workflows.
- If no equivalent fits, record the exact gap, keep code route-local, and do not edit framework code without explicit approval. Summaries must state `Reused`, `Searched`, and `Gap`.
