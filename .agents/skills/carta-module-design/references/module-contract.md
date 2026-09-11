# Module contract

`plans/<feature>/design.md` owns intended behavior and approval. Plans own
technical decisions; the worksheet owns progress; reports own observed results.
Use tables for data, YAML records for actions and acceptance, and Mermaid for
branched workflows. Diagrams reference rule IDs; records remain authoritative.
Existing approved artifacts can retain their format when they meet this contract.

## Record rules

Assign stable IDs to workflows (`W-01`), behaviors (`B-01`), transitions (`T-01`),
invariants (`I-01`) and acceptance cases (`A-01`). Define each rule once and link
its consumers. Keep reasons and source notes outside executable conditions.
A blank required property is incomplete. `NONE` is an explicit absence;
`UNRESOLVED` blocks affected work. An unchanged contract reference names its
path and symbol or rule ID. Define technical terms before using them.

## Authority and scope

Record feature, revision, status (`DRAFT`, `APPROVED`, `BLOCKED`), approval source,
date and scope. Separate current behavior from intended changes. A new entity
does not imply additional CRUD actions, collections or administration screens. Record actors,
entry points, outcomes, exclusions, affected owners and consumers using
[context discovery](context-discovery.md).

| Claim ID | Statement | Authority | Source | Affected IDs |
|---|---|---|---|---|

Authority is `OBSERVED` for current evidence, `CONFIRMED` for user requirements,
`PROPOSED` for recommendations, or `UNKNOWN` for missing knowledge. Use one
classification per claim; separate observed facts from proposed decisions. Record conflicts
and their resolution. Approval identifies the exact revision; silence is not approval.

Trace supplied process branches and UI requirements to rule IDs or explicit
exclusions. When sources differ, name which source governs each affected behavior.
Treat an inferred rule as a proposal until confirmed; general approval does not
resolve contradictory rules within the same revision.

## Data tables

For each new or changed entity, name its meaning, owner and identity. Use:

| Field | Meaning | Stored type / values | Initial value | Required by action | Writable by action | Omitted / null input | Uniqueness scope / derivation |
|---|---|---|---|---|---|---|---|

| Relationship | Cardinality | Owner | Valid references | Parent-change effects | Delete / recovery effects |
|---|---|---|---|---|---|

Specify precision, units, time basis and rounding where meaningful. Include
migration of existing data, retained file keys versus URLs, dependent selection
clearing, and mutable versus derived values where applicable. Reference unchanged
schema owners instead of copying them.

## Workflow inventory

List every in-scope branch, invariant and required sequence in this coverage table.
Use one row per obligation; `Obligation` is a unique ID, including workflow path
IDs such as `W-01.normal`. Include alternative entry points, return/resubmit paths,
permitted prerequisite orders and cross-module effects when they exist.

| Obligation | Rule references | Acceptance IDs |
|---|---|---|

For UI workflows, list the distinct browser journeys:

| Journey | Obligation | Acceptance IDs | Distinct interaction |
|---|---|---|---|

Use stable `J-01` IDs and existing obligation/acceptance IDs. Select paths by the
[journey rule](../../carta-module-development/references/verification-strategy.md#browser-journeys),
including conditional required inputs. Headless or unchanged UI work keeps an
empty table with its reason. This table selects proof; action records own rules.

Present this inventory during design review. The worksheet checker cannot discover
business work omitted here. Explicit exclusions belong in scope, not this table.

For stateful behavior, define each state variable, initial value, valid combinations
and terminal states. Give named conditions exact predicates. Use:

| Transition ID | From state | Action | Condition | To state | Effect references |
|---|---|---|---|---|---|

Define invariants separately:

| Invariant ID | Condition that must remain true |
|---|---|

Every defined behavior, transition and invariant must appear in the inventory's
Rule references. Use exact IDs, not ID ranges.

Specify no-match rejection and overlapping-condition precedence, or make conditions
exclusive. For joins, define completion; for returns, define retained and cleared
values. A linear resource needs no artificial state machine.

For each completion condition, define the evidence or authorized confirmation
that establishes it. For return/resubmit paths, state which prior decisions and
reasons remain available after another cycle. Check terminal-state restrictions
against every action, including attachment and metadata writes. Reference these
conditions from action records so transitions and actions use the same rule.

## Action records

Use one record per action. Every property below needs a value or `NONE`; expand
conditions and effects into referenced records when several actions share them.
Use field/value maps and condition/result rows, not paragraphs inside scalar values.
Separate alternatives into rows. Reference data-table rules instead of copying them.

```yaml
id: B-01
workflow: W-01
name: <business action>
access:
  actor: <permission or role>
  scope: <record ownership predicate>
  assignment: <predicate or NONE>
  denied: <observable result; unchanged data>
input:
  fields: <field names mapped to data-table rules and action-specific overrides>
  unknown_fields: <reject or ignore>
preconditions:
  - condition: <exact predicate or condition ID>
    otherwise: <rejection result; unchanged data>
effects:
  set: <field-to-value map or NONE>
  clear: <field names or NONE>
  create: <record types and field-to-value maps or NONE>
  delete: <record selection or NONE>
  preserved: <other relevant data>
  transaction: <coupled writes and rollback boundary>
  transitions: <transition IDs or NONE>
  external: <delivery, failure and recovery rules or NONE>
repeat:
  result: <duplicate/retry outcome>
  effects: <write changes and effect counts>
concurrent:
  outcomes: <allowed final outcomes>
  preserved: <effects that cannot be lost or duplicated>
result: <returned data and visible outcome>
ui:
  entry: <route or surface>
  parent_visibility: <retained pages or NONE>
  back: <target or NONE>
  control:
    label: <framework default, or confirmed exact text and source>
    visible: <predicate>
    enabled: <predicate>
  fields: <editable/read-only fields; defaults; dependent lookups>
  states: <loading, empty, denied and error behavior>
  success: <confirmation, navigation, refresh and reload behavior>
  failure: <feedback, input preservation and recovery>
acceptance: [<acceptance IDs>]
```

Use `ui: NONE` for headless actions and define the consumer result instead.
Specify required display data and unaffected interfaces. Apply Carta navigation
and visual conventions by reference where they settle the result.

## Acceptance records

Expected values come from confirmed rules and worked examples, not implementation.
Cover each independent condition, transition branch and invariant. Include boundary
and rejection cases that distinguish plausible wrong results, plus complete sequence
cases where isolated action tests cannot prove the workflow.

```yaml
id: A-01
rules: [<behavior, transition or invariant IDs>]
given:
  actors: <named actors mapped to identity, permissions and scope>
  records: <named records mapped to concrete field values>
when:
  - actor: <fixture actor>
    action: <action ID>
    input: <field-to-value map or NONE>
expect:
  result: <exact observable output or rejection>
  stored: <record/field-to-value map and effect counts>
  unchanged: <data that must remain unchanged or NONE>
  visible: <UI result or NONE>
```

## Boundaries and readiness

Record interfaces to preserve, permitted environments, and technical decisions
reserved for planning. The planner settles architecture; the executor receives
routine coding freedom only. Framework edits and external/destructive writes
require explicit authority; design approval does not authorize deployment.

Ready means all inventory obligations have acceptance cases, each action and
invariant has one unambiguous definition, sources and owners are identifiable,
and no in-scope business decision remains unresolved. Review conflicts and missing
behavior, not headings alone. Record the approved revision and decision sources.
A changed rule reopens its affected approval, plans and evidence; preserve valid work.
Only new or changed business decisions need approval. Technical completion of a
record preserves the existing approval scope.
