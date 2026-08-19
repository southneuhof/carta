# Plan 090: Focus ADS-HK module discovery and localize workflow skills

Status: DONE

Verified: 2026-08-19 by skill validation, metadata validation, simple-module
static verification, complex-module relation evidence, global-path checks,
scope review, and whitespace checks.

Planned at: `646a340`

Dependencies: Plans 087 and 088 are `DONE`. Plan 089 is the current example
of the manifest-driven simple-module path.

## Why this change

The module workflow reads too much before it knows the module shape. The
observed emergency-simulation-topics task spent about 13 minutes and read
unrelated module files, old plans, and generator source before using the
existing generator. This delays simple work and also hides the direct evidence
needed for complex work.

The fix is a routing change, not a new generator. Every module gets a cheap
shape triage and a small evidence ledger. A clear standard CRUD module uses
the existing manifest pipeline. A relation, workflow, custom surface, or
unclear contract escalates to the full design and plan workflow. The full path
keeps its parity, permission, browser, and independent-verifier gates.

## Scope

| Path | Change |
|---|---|
| `AGENTS.md` | Replace the unconditional full-discovery wording with the scoped triage and escalation rule. |
| `.agents/skills/ads-hk-module-slice/SKILL.md` | Make the skill a short router and owner of phase gates. Keep the simple pipeline and complex-module requirements. |
| `.agents/skills/ads-hk-module-slice/agents/openai.yaml` | Describe focused discovery and safe escalation. |
| `.agents/skills/ads-hk-module-slice/references/module-discovery.md` | Add the progressive-disclosure recon protocol, evidence ledger, and escalation rules. |
| `.agents/skills/ads-hk-module-slice/references/module-acceptance-checklist.md` | Require scoped evidence without requiring unrelated sibling or CRUD-surface reads. |
| `.agents/skills/verify-ads-hk-module/SKILL.md` | Let verification consume scoped evidence and machine reports while retaining independent parity and browser checks. |
| `.agents/skills/verify-ads-hk-module/agents/openai.yaml` | Keep the verifier invocation focused on the selected module contract. |
| `plans/README.md` | Record this plan and its completion status. |

The two ADS-HK workflow skills currently under `/Users/gamer/.agents/skills/`
will move to the listed repo-local paths. No global ADS-HK copy will remain.

Out of scope: `scripts/scaffold-master-data.mjs`,
`integrate-master-data.mjs`, `verify-module.mjs`, framework packages, app
source, generator behavior, and other global skills.

## Design

1. Parse the request and identify exact slugs, tables, legacy names, and
   requested behavior.
2. Search exact identifiers first. Read repository rules, the direct legacy
   owner, and the current owner or nearest direct route only when present.
3. Record each answer in a small evidence ledger with a path and symbol or
   line. Read one sibling only when a concrete pattern gap remains.
4. Classify the module from evidence:
   - standard CRUD with no relation, consumer lookup, workflow write, custom
     surface, or unresolved contract uses the existing manifest path;
   - any relation, child record, lookup consumer, workflow or custom API,
     custom UI/framework gap, scoped transaction, or ambiguity uses the full
     design and plan path.
5. For the simple path, run the generator and inspect its JSON paths before
   reading broad generated or sibling source. The generator remains the
   contract for generated files; the workflow reads only the returned paths
   and direct integration owners.
6. For the complex path, continue with the full field, route/action,
   permission, ownership, legacy-parity, design, plan, implementation, and
   browser gates. The router must never use the simple path to hide an
   unresolved decision.

This is a read-budget rule, not a simple-master-data rule. The same direct
evidence ledger and escalation rule applies to complex modules; complex work
gets more reading only when its evidence requires it.

## Implementation steps

1. Move the exact `ads-hk-module-slice` and `verify-ads-hk-module` directories
   from the global skill root into the repo-local skill root after confirming
   both destination paths are absent.
2. Rewrite the module skill entry point and add the discovery reference. Keep
   the existing acceptance checklist and layer-skill handoffs, but remove
   repeated layer instructions from the orchestrator.
3. Update the acceptance checklist and verifier so both accept scoped evidence
   and still require independent contract, label, permission, seed, focused
   check, authenticated browser, and `PASS` evidence.
4. Update repository instructions and skill metadata to describe the new
   routing.
5. Validate the local skills, changed instructions, global removal, and two
   forward scenarios: `emergency-simulation-topics` must use the bounded path;
   `permit-attachment` or `permit-category-apd` must escalate because it has a
   relation or nested workflow.

## Done criteria

- The module skill has a short entry point with a search-first triage and
  explicit simple/complex escalation.
- The discovery reference contains the evidence-ledger format, bounded read
  order, generator-output rule, and full complex path.
- No instruction requires reading every sibling or every list/detail/create/
  edit surface before shape triage. Required parity surfaces remain required
  when their contract is in scope.
- A direct generator output is read before generator implementation source for
  a simple module.
- An ambiguous or relation-backed module cannot enter the simple path.
- The verifier remains read-only and independently checks the selected
  contract, not only the implementation summary or machine report.
- The two ADS-HK skills exist under `/Users/gamer/Documents/projects/ads-hk/.agents/skills/`
  and do not exist under `/Users/gamer/.agents/skills/`.
- Skill validation, frontmatter/metadata validation, `git diff --check`, and
  the repository scope review pass.

## Verification commands

```sh
python3 /Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  /Users/gamer/Documents/projects/ads-hk/.agents/skills/ads-hk-module-slice
python3 /Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  /Users/gamer/Documents/projects/ads-hk/.agents/skills/verify-ads-hk-module
git diff --check
test ! -e /Users/gamer/.agents/skills/ads-hk-module-slice
test ! -e /Users/gamer/.agents/skills/verify-ads-hk-module
```

The validator may need the repository's existing temporary YAML shim when
PyYAML is unavailable. Do not add a dependency for validation.

## Implementation report

STATUS: COMPLETE

STEPS:

- Moved `ads-hk-module-slice` and `verify-ads-hk-module` into the repo-local
  `.agents/skills/` directory. Both global paths are absent.
- Replaced the broad module entry workflow with exact search, evidence-ledger,
  shape triage, generator-first, and complex-module escalation rules.
- Added the progressive-disclosure discovery reference and narrowed the
  acceptance checklist and independent verifier to scoped evidence.
- Updated `AGENTS.md` and both skill metadata files.
- Verified the existing `emergency-simulation-topics` manifest with
  `verify:module --check-only` (`MODULE PASS`). Verified that
  `permit-attachment` has direct relation evidence and must escalate.
- Skill Creator's validator passed for both skills with a temporary stdlib YAML
  shim because PyYAML is not installed. Ruby metadata parsing, whitespace,
  `git diff --check`, and scope checks passed.

FILES CHANGED: `AGENTS.md`, `plans/README.md`, this plan, and the two
repo-local ADS-HK skill directories. Generator scripts, framework packages,
and app source were not changed.

NOTES: This is a skill and instruction change. No user-facing app flow changed,
so an authenticated browser check was not required for this plan.
