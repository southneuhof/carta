# UI verification

Use the shared [verification strategy](../../carta-module-development/references/verification-strategy.md)
for test selection and completion evidence. Read current package scripts for
commands; run the relevant type check, lint, and existing focused checks.

Review custom UI code against the
[framework-first composition rule](../SKILL.md#framework-first-composition).
Check whether each custom block owns an unmet requirement or duplicates supported
framework behavior. Reuse the pattern checks from planning; inspect new deviations.
Run the [UI contract check](ui-contract.md) for declared component use and
resolution. Inspect source for undeclared surfaces and unjustified exceptions.
Behavior tests prove interaction; neither test counts nor component imports prove
framework composition.

Choose tests by failure risk, not by file count:

- A dependency test changes the parent, proves the stale child is cleared, and
  checks the submitted value. Calling the behavior function alone misses wiring.
- A workflow test opens the action, submits its input, observes the saved state,
  and proves the next allowed action changed.
- A custom collection test checks that switching presentation keeps its query
  and actions. Do not repeat the framework's table test suite in every module.
- For route structure, tabs, Back, or page lifetime, use the checks in
  [file routing](file-routing.md#verify-changed-behavior). A permission test must
  prove a real denied action; route objects alone do not establish denial.

Use a focused browser journey for changed interaction or integration that
smaller tests cannot establish. Use isolated test data. Assert the visible
result and, for writes, persistence after reload. Use accessible locators and
observable state rather than sleeps or DOM structure snapshots.

Inspect meaningful UI changes at wide and narrow widths, including keyboard
access, long content, empty/error states, and dialogs as applicable. Visual
inspection and functional tests answer different questions. State exactly
which ran. If required browser evidence is unavailable, report that gap; a
passing type check does not establish the interaction.
