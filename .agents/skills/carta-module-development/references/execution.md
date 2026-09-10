# Execute a module plan

The orchestrator owns assignment, review and worksheet state. Give the executor
the approved design revision, one plan, relevant worksheet rows, dependency
interfaces, evidence and write boundaries. Confirm implementation authority and
compare source drift before edits. Keep unaffected work valid.

## Execute one cycle

1. Write the planned executable behavior test. Run its focused command and inspect
   the failure. Apply the red-evidence rules in
   [verification strategy](verification-strategy.md).
2. At a required before-implementation gate, return the test and red evidence to
   the orchestrator. Continue this cycle only after its test review passes.
3. Implement the smallest change that satisfies the approved assertions. Follow
   layer contracts, then run the focused test and affected regression checks.
4. Record evidence and continue the next cycle in this plan. Rework a failed check
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
