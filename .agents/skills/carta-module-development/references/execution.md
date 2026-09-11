# Execute a module plan

## Assignment

The orchestrator owns review and worksheet state. Each worker assignment names:

- Carta Module Development workflow; executor role; this reference's exact path.
- Approved design revision, one plan, worksheet rows and dependency interfaces.
- Required layer skill paths, selected references, source and evidence paths.
- Permitted edits, test target, side effects and the return gate.

Select layer skills before dispatch: `api-conventions` for API work,
`web-ui-surfaces` for web surfaces, and `build-resource-form` for forms. Include
`contract-rules.md` for cross-layer work and `frontend-field-contract.md` for
resource/form fields. A transcript or “apply relevant skills” is insufficient.

The executor reads this reference and the assigned contracts. Before edits, run:

```sh
python3 .agents/skills/carta-module-development/scripts/check_worksheet.py plans/<feature>
```

A failed preflight returns to the planner; it is not permission to select coverage
while implementing. Check source drift and name the applicable contracts and
first planned check in the opening update. Missing context returns to the parent. Nested assignments carry
the same applicable contract paths, authority and return gate. Direct execution
uses these steps without a dispatch packet.

Before UI edits, the plan must contain its UI contract and mapped browser journeys.
If either is missing or changes, return the proposed mapping and assertions to the
orchestrator for review first. Derive them from behavior and component source,
not the existing implementation or test list. Direct execution records a self-review.
Approval of business behavior does not establish technical proof coverage.

The handoff identifies changed owners, deviations from planned components or
interfaces, commands/results and unmet obligations. Reading a skill is not proof
of compliance; acceptance requires source inspection and executable evidence.

## Execute one cycle

1. Write the planned executable behavior test. Run its focused command and inspect
   the failure. Apply the red-evidence rules in
   [verification strategy](verification-strategy.md).
2. At a required before-implementation gate, return the test and red evidence to
   the orchestrator. Continue this cycle only after its test review passes.
3. Implement the smallest change that satisfies the approved assertions. Follow
   layer contracts, then run the focused test and affected regression checks.
4. Run executable checks through the module evidence recorder; preserve its JSON
   and raw logs. Check report freshness before handoff. A written result summary
   cannot replace command evidence. Continue the next cycle in this plan. Rework a failed check
   from its observed cause; preserve prior failures and changed-test details.

Use [UI automation](ui-automation.md) for browser cycles. Keep fixtures, migrations
and storage within the plan's isolated target. Generation does not authorize
migration application. For eligible source generation, read [bounded.md](bounded.md)
and write the first behavior test before running the generator.

The executor can correct setup within scope. Return changed assertions, public
interfaces, transaction boundaries or dependencies to the orchestrator before
proceeding. Business outcome changes need their decision authority. A repository
conflict reports the exact owner and mismatch; it does not justify inventing policy.

## Review every plan

The executor stops after the plan and returns its handoff. Set `IMPLEMENTED` only
when its implementation and required checks are complete. Invoke
`$verify-carta-module` for that plan before assigning another one.

- `PASS`: record the review, set `VERIFIED`, then assign the next ready plan.
- `REWORK`: return defects, acceptance IDs and corrections to the same executor.
- `BLOCKED`: record the missing decision, evidence, environment or authority.
  Continue independent work whose prerequisites and review gates are satisfied.

At a test gate, review the assertions against the approved cases and inspect red
output; this is not implementation acceptance. In direct execution, label each
review as self-review and keep the same gates. Repeated failure without a new
cause or correction returns to the orchestrator for diagnosis, not blind retries.

## Finish

Use the [worksheet contract](module-execution-worksheet.md) to check complete
coverage, evidence and state. Run final module review for cross-plan effects and
required sequences. Update affected application-map entries with actual owners.
Report delivered behavior, checks, blocked work and unverified results.
