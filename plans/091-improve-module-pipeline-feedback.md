# Plan 091: Improve module pipeline feedback

Status: DONE
Planned at: `646a340`

## Scope and decision

Fix the shared ADS-HK module tooling that caused the P0-P1 findings from the
forward test. Keep the bounded manifest path for proven standard CRUD. Keep the
full legacy, parity, permission, browser, and independent-verifier gates for
complex modules.

In scope:

- `scripts/integrate-master-data.mjs` and its focused tests;
- `scripts/verify-module.mjs` and its focused tests;
- root module workflow instructions;
- repo-local `ads-hk-module-slice` and `verify-ads-hk-module` skills;
- this plan and the plan index.

Out of scope:

- framework packages;
- the current emergency-simulation module implementation;
- the generator's domain contract expansion;
- plan-number allocation and scaffold dry-run support;
- unrelated application features.

## Findings

| ID | Evidence | Correction |
|---|---|---|
| P0 | `scripts/integrate-master-data.mjs` inserts after an existing separator instead of after `navigation.after`. | Always use the exact anchor. Reuse an existing separator without moving the entry. Add a same-separator order test. |
| P1 | `scripts/verify-module.mjs` runs seed without migration, hides duration, and has no timeout. | Run local migration before seeded verification. Report duration and timeout state. Add a configurable command timeout. |
| P1 | The implementer and independent verifier repeat the same passing command set. | Save one JSON command report. Let the independent verifier consume it and rerun only missing, stale, failed, or risk-specific checks. |

## Implementation order

1. Add the navigation regression test and fix the shared insertion function.
2. Extract the verification command list so its order is testable.
3. Add migration preflight before the two idempotent seed runs.
4. Add command duration, timeout, signal, and failure output to the report.
5. Update the two repo-local skills and root instructions to use one fresh JSON
   report without removing independent source, parity, or browser review.
6. Run focused script tests, skill validation, syntax checks, and diff checks.

## Done criteria

- A module entry is after its configured anchor when its separator already
  exists.
- The integration test proves separator, anchor, and entry order.
- Seed verification applies local migrations before either seed run.
- Every run command has a duration and timeout result in the pure JSON output
  captured with `pnpm --silent`.
- A hung command fails with a clear timeout result.
- The independent verifier consumes a fresh report and does not repeat passing
  commands without a reason.
- Both repo-local skills pass Skill Creator validation.
- No global ADS-HK skill is created or restored.
- Script tests, syntax checks, and `git diff --check` pass.

## Verification commands

```sh
node --test scripts/scaffold-master-data.test.mjs scripts/integrate-master-data.test.mjs scripts/verify-module.test.mjs
node --check scripts/scaffold-master-data.mjs
node --check scripts/integrate-master-data.mjs
node --check scripts/verify-module.mjs
python3 /Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/ads-hk-module-slice
python3 /Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/verify-ads-hk-module
git diff --check
```

## Implementation report

STATUS: COMPLETE

- Fixed navigation insertion to honor `navigation.after` when the separator
  already exists.
- Added a regression test for separator, anchor, and entry order.
- Added migration preflight before repeated seed verification.
- Added command duration, timeout, signal, error, and failure-output fields to
  the JSON report. The default timeout is 180 seconds and can be overridden by
  `--timeout-ms`.
- Updated the repo-local module and verifier skills, using Skill Creator
  validation. The global ADS-HK skill paths remain absent.
- Verified the real emergency-simulation employee module: static PASS, API 2/2,
  web 3/3, focused lint, API/web type checks, migration, two seed runs, and
  `git diff --check` PASS. The run completed in about 54 seconds and reported
  per-command durations.

No browser check was added because this plan changes tooling and instructions,
not a user-facing application flow. The module browser evidence remains in its
existing plan.
