# Module execution worksheet

The selected module plan is the single human-facing handoff. Its execution
worksheet is a required section in that same plan. Do not create a separate
free-form task-notes file.

## Document ownership

| Information | Owner |
|---|---|
| Business and architecture decisions | Approved design document |
| Technical scope, file ownership, order, commands, and stop conditions | Module plan |
| Discovery evidence needed by the executor | Evidence ledger in the module plan |
| Current step, next action, blockers, and completed evidence | Execution worksheet in the module plan |
| Acceptance outcomes | Acceptance checklist in the module plan |
| Command output | Named report file, linked from the module plan |
| Cohort order and module status | `plans/README.md` |

The plan may summarize approved design decisions, but it must link to the
approved design document. Do not silently change a locked decision in the plan
or worksheet.

## Discovery stub and plan lifecycle

Create a minimal discovery worksheet stub before the first module-specific
source read. It may identify the module and record live discovery evidence, but
it is not the technical plan. Use the same plan file through all phases:

1. `DISCOVERY`: initialize the worksheet and record the evidence ledger.
2. `DESIGN`: write the design document, obtain written approval, link its path,
   and record locked decisions.
3. `PLAN`: derive the technical plan from the approved design, then add
   technical steps, file ownership, commands, stop conditions, and the copied
   acceptance checklist.
4. `READY`: mark the plan ready for source edits after design and plan approval.
5. `EXECUTE`: work one active step at a time and update the worksheet.
6. `VERIFY`: finish implementation steps and hand the plan to the independent
   verifier.
7. `DONE`: use only after the verifier returns `PASS`.

For a bounded simple module, the approved manifest is the bounded contract.
Create it only after the discovery and design gate. The plan still owns the
worksheet, evidence, acceptance checkpoint, and reports.

## Worksheet template

Put this section near the top of the module plan:

```markdown
## Execution worksheet

- State: `DISCOVERY`
- Module: `<module>`
- Plan: `<absolute or repository-relative plan path>`
- Design: `<TBD during DISCOVERY; required before PLAN>`
- Planned at: `<short SHA>`
- Active step: `1`
- Next action: `<one exact read, edit, or command>`
- Read boundary: `<files or directories allowed for the active action>`
- Write boundary: `<files allowed for the active action>`
- Last result: `None`
- Last evidence: `None`
- Blocker: `None`

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | ACTIVE | `<one exact action>` | `<paths>` | `<observable result>` | `<path/result>` |
| 2 | TODO | `<one exact action>` | `<paths>` | `<observable result>` | — |
```

Use `TODO`, `ACTIVE`, `PASS`, `REWORK`, and `BLOCKED` for worksheet step status.
Use `DONE` only for the whole worksheet after verifier `PASS`.

## Update rules

Before an action:

- set exactly one step to `ACTIVE`;
- write one exact `Next action`;
- write the `Read boundary` and `Write boundary`;
- list the expected result and the evidence that will prove it.

After an action:

- record the result and a path, command report, or browser result;
- set the step to `PASS`, `REWORK`, or `BLOCKED`;
- update `Last result` and `Last evidence`;
- activate the next step only after the current step is `PASS`.

Apply these rules:

- During `DISCOVERY`, `DESIGN`, and `PLAN`, write only the plan, design, and
  other explicitly approved planning artifacts. Do not edit module source.
- Before design approval, keep the plan limited to the discovery worksheet,
  evidence ledger, unresolved questions, and generic placeholders. Do not add
  technical scope, target files, implementation commands, design decisions, or
  done criteria.
- After discovery, write the design document to the repository and stop for
  written approval. A chat proposal is not a design artifact. Only after
  approval may `$improve` derive the technical plan and may the plan enter
  `PLAN`.
- Set the worksheet to `READY` only after the design and technical plan are
  approved. Set it to `EXECUTE` when source edits begin.
- Every module-specific file read must answer a named ledger or plan question.
- If a required path is outside the current read boundary, record why before
  reading it. If the reason is not supported by the contract, stop.
- Do not copy source files or long command output into the worksheet. Link the
  exact path or named report instead.
- A new business, API, permission, route, framework, or legacy decision is
  `PLAN CHANGE REQUIRED`; stop and return to the design or planning gate.
- A full-suite command needs an explicit cross-module reason in the worksheet.
- Browser evidence must record the URL, surface, action, temporary data ID, and
  visible result. Local CRUD fixtures remain pre-authorized only within the
  existing browser safety rules.
- A batch has one plan and worksheet per module. Shared roots use serial writes.

The worksheet is a live control record, not a second design document and not a
place to bypass an approval gate.
