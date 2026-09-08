# Module contract

This is the authoritative structure and readiness bar for
`plans/<feature>/design.md`. The design skill produces it; the planner and
verifier consume it. Scale detail to the behavior. Combine small sections when
clear; omit irrelevant extension sections with a short scope reason. Existing
well-formed designs can keep their layout if they satisfy these semantics.

## Header and authority

Record feature name, revision (for example `D1`), status (`DRAFT`, `APPROVED`,
`BLOCKED`), approval source and date, and the scope of that approval. Identify
which request or existing design this revision changes. State that intended
behavior belongs here, execution organization in numbered plans, progress in
`worksheet.md`, and observed results in reports.

Approval records name the revision reviewed. Record a material change with its
affected behavior IDs and new approval; do not reset unrelated approved rules.
An imported approved document remains a valid authority with its exact source.

## 1. Purpose and scope

Describe outcomes, actors, entry points and the journeys included in this
slice. State explicit exclusions and dependencies. Identify the existing
behavior to preserve and the intended change. A request for one action does not
implicitly include the other CRUD actions.

## 2. Context, evidence and decisions

Include the affected-system map from [context-discovery.md](context-discovery.md),
applicable vocabulary and source references. For consequential claims use:

| ID | Statement | Authority | Source | Applies to |
|---|---|---|---|---|

`OBSERVED` means current code or evidence demonstrates it. `CONFIRMED` means
the user or their designated authority established the desired rule.
`PROPOSED` means a recommendation is awaiting a decision. `UNKNOWN` means
knowledge is missing. These categories are not interchangeable.

Record material conflicts and their resolution. Maintain an unresolved table
with impact and next action while drafting. An approved delivery scope has no
unresolved behavior-changing decision; explicit exclusions are allowed.

## 3. Data and relationships

For new or changed data, state meaning and owner, identity, type/value domain,
requiredness, defaults, uniqueness and scope, mutable versus derived values,
and write/read behavior. State relationship cardinality, ownership, valid
references, and lifecycle effects. Reference unchanged schema contracts by path
and symbol; avoid copying entire existing models.

Where applicable, specify deletion/recovery, existing-data migration, retained
file keys versus external URLs, derived display metadata, and how dependent
selections react when an upstream value changes. Overall labels such as
"soft delete" or "parent-child" are not a substitute for those rules.

## 4. Actions and workflows

Give each material behavior a stable ID, such as `B-01`. For each action define:

| Concern | Contract content |
|---|---|
| Actor and access | Who can act on which records and states; relevant ownership/scope and denial behavior. |
| Input and preconditions | Accepted business input, defaults, validation and state prerequisites. |
| Success | State transition, persisted effects, returned or visible result, and affected consumers. |
| Failure | Business rejections, access denial, unavailable dependencies and observable recovery behavior. |
| Repeated/concurrent use | Idempotency, conflict outcomes and atomic effects when the action can be retried or raced. |

For stateful workflows, include a transition table: from state, action, actor,
condition, to state, effects, and rejected transitions. For permissions, map
actions to the existing authorization vocabulary and exact codes when these
are already public or selected. A new code's spelling can be delegated to
planning under Carta naming rules; the access policy and scope cannot.

Describe integrations, jobs, delivery failures and compensation only where
the behavior needs them. Explicitly state the transaction boundary for coupled
writes whose partial success would violate a business invariant.

## 5. User-visible and consumer behavior

Specify applicable routes/entry points, navigation, visible actions, essential
labels and data, defaults, read-only/hidden/disabled behavior, and meaningful
loading, empty, error and denied states. Identify confirmation and successful
submission behavior, reload/persistence expectations, dependent lookups, and
which lists/details/reports refresh after mutation.

For nested navigation, state which parent pages remain visible and where page
Back returns. Use the defaults in the
[file-routing convention](../../web-ui-surfaces/references/file-routing.md)
unless the required behavior differs. File placement is a planning decision;
an existing data relationship alone does not determine the visible parent chain.

For a UI reference, say which elements are authoritative (content, interaction,
layout or styling). Use the existing Carta design system for delegated visual
detail. Headless changes instead state their API or consumer-facing contract.

## 6. Acceptance examples

Assign stable acceptance IDs (`A-01`, `A-02`) and link each to behavior IDs.

| Acceptance ID | Behavior IDs | Given / When | Observable expected result |
|---|---|---|---|

Cover important success, rejected access, invalid input, state/lifecycle and
cross-module consequences. Include a boundary or counterexample when two
plausible implementations could otherwise both appear correct. Acceptance
specifies the result; the plan selects the test surface and exact command.
Do not require all examples through every layer.

## 7. Implementation boundaries and open decisions

Identify existing interfaces to preserve, technical discretion delegated to
planning/implementation, and approved read/write environments. Framework
package changes and external/destructive writes need explicit authority.
The design does not confer deployment, publication or production permission.
Record excluded behavior and any unresolved material decisions.

## Example of behavioral precision

The following is illustrative, not an approval policy for Carta applications:

**B-01:** A department approver can approve a submitted request in their own
department, except their own request. Approval atomically records the approver,
approval time, Approved state and one audit event. A repeated approval by the
same actor returns the existing result without another audit event. In a race
with rejection, only the first committed transition succeeds; the other action
receives a state-conflict result. After success and reload, detail shows the
approval and the pending queue excludes the request.

**A-01:** Given a submitted request created by the approver, when that approver
attempts approval directly, access is denied and status/audit state is unchanged.

**A-02:** Given a successful approval, when the same actor repeats the action,
the original result is returned and exactly one audit event exists.

These requirements leave code structure open, but not business outcomes.

## Readiness review

The contract is ready when:

- its sources, existing context and affected owners are identifiable;
- each in-scope action and material invariant has one unambiguous definition;
- important failures and consumer effects have observable acceptance examples;
- no material business behavior is left for the implementer to invent;
- approved behavior and delegated technical choices are distinguishable;
- material contradictions and unknowns are resolved or explicitly excluded;
- the exact approved revision and approval authority are recorded.

Review for conflicting meanings, not merely missing headings or hedge words.
A deterministic validator cannot establish business completeness. Re-run the
semantic review on changed requirements after a material revision.
