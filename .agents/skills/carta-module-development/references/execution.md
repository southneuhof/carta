# Execute a module plan

Use the current design revision, worksheet and selected plans as the handoff.
Confirm implementation authority and relevant source drift before editing.
Preserve unrelated work. Source paths are grounded owners, not a reason to stop
for every routine supporting edit within approved scope.

For each coherent slice, implement the dependency-ordered data/API/resource/UI
changes and their tests. Follow the routed layer contracts. Extend database domains,
navigation, relation loading, permissions and affected caches when the approved
behavior requires them. Derive field and permission mappings from the contract;
new business policy returns to the design skill.

Use the plan's environment boundary for migrations, fixtures and tests. Generating
migration files is different from applying them. Existing test setup does not
authorize development seed/reset commands or live external writes. The bounded
source generator does not run migrations; review and generate the required SQL
before testing persistence. Check [bounded.md](bounded.md) only when eligible.

Use [verification-strategy.md](verification-strategy.md) for the proof obligations
and evidence loop. Fix implementation, fixture or tooling faults within scope
and rerun the affected check after a justified change. Broaden diagnosis when
new evidence points beyond the current owner. Do not reinterpret the approved
result to make a test pass. A newly exposed product decision blocks only the
affected work until its authority is resolved.

Record implementation pointers and evidence in the worksheet's acceptance rows.
Set a plan to `IMPLEMENTED` when its own work and required checks are complete.
At a planned risk gate or final delivery, use `$verify-carta-module`. An
independent reviewer uses the same contract when available; direct execution
uses an explicitly labeled self-review. The verifier reviews current evidence
rather than repeating every check. Rework stays with the owning slice.

At feature completion, check cross-plan consumer effects, record the final
review, advance the verified states, and update changed application-map entries
with the actual implemented owners. Report the delivered behavior, evidence,
remaining limitations and any explicitly deferred work.
