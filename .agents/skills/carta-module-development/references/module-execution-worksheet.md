# Module execution worksheet

Use one feature folder as the stable handoff across design, planning,
delegation, and verification:

```text
plans/<feature>/
├── design.md
├── worksheet.md
├── 01-<vertical-result>.md
└── reports/
```

## Ownership

| Information | Owner |
|---|---|
| Product and architecture decisions | `design.md` |
| Artifact ledger, plan map, dependencies, and feature state | `worksheet.md` |
| Technical order, owned areas, checks, and stop conditions | Numbered plan |
| Command and UI output | Named file under `reports/`, linked from the plan |
| Acceptance status | One matrix in `worksheet.md`, with rows owned by plans |

Do not copy a locked decision into a second authoritative location.

## Lifecycle

Use the first applicable state. Resume it when artifacts already exist.

`INTAKE` → `DESIGN` → `DECOMPOSE` → `PLAN` → `READY` → `EXECUTE` →
`VERIFY` → `DONE`

- `INTAKE`: classify supplied and repository artifacts.
- `DESIGN`: resolve only missing material decisions and obtain needed approval.
- `DECOMPOSE`: divide work by observable vertical results and dependencies.
- `PLAN`: write or refine numbered implementation plans.
- `READY`: design and active plan meet their gates.
- `EXECUTE`: delegated or direct implementation is active.
- `VERIFY`: all executor-owned checks pass; independent review is pending.
- `DONE`: all acceptance rows have current evidence and review passed when
  required.

## Feature worksheet template

```markdown
# <Feature> worksheet

- State: `INTAKE`
- Feature: `<feature-slug>`
- Modules: `<related modules>`
- Grouping reason: `<shared user journey or contract>`
- Design: `<path or TBD>`
- Active plan: `None`
- Next action: `<one exact action>`
- Read boundary: `<paths>`
- Write boundary: `<paths or none>`
- Last result: `None`
- Last evidence: `None`
- Blocker: `None`

## Artifact ledger

| Artifact | Approval | Current | Owns | Gaps or conflicts | Classification |
|---|---|---|---|---|---|
| `<path/request>` | `<state>` | `<yes/no>` | `<decisions>` | `<result>` | `<intent/draft/design/plan/code>` |

## Contract evidence

| Question | Evidence | Result | Status |
|---|---|---|---|
| User journey and actions | `<path:line>` | `<answer>` | TODO |
| Data and relation ownership | `<path:line>` | `<answer>` | TODO |
| Permissions | `<path:line>` | `<answer>` | TODO |
| Routes and navigation | `<path:line>` | `<answer>` | TODO |
| UI states and validation | `<path:line>` | `<answer>` | TODO |
| Seed or migration need | `<path:line>` | `<answer>` | TODO |
| Acceptance outcomes | `<path:line>` | `<answer>` | TODO |
| Framework gap | `<path:line>` | `<answer>` | TODO |

## Plan map

| Plan | Observable result | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-<result>.md` | `<user result>` | `none` | TODO | — |

## Decisions and blockers

- None.
```

## Update rules

Before an action, record one next action and its read and write boundaries.
After it, record the result and evidence. Use `TODO`, `ACTIVE`, `PASS`,
`REWORK`, and `BLOCKED` for work. Use `DONE` only after acceptance is complete.

During intake, design, decomposition, and planning, write only planning
artifacts. Source edits start at `EXECUTE`. If implementation reveals a new
material decision, keep valid completed work and return to `DESIGN` or `PLAN`.
