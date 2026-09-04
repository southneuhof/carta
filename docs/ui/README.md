# Carta UI contract

- **Status:** Authoritative
- **Scope:** `apps/web` and UI surfaces from `packages/loom`

This contract owns standard page structure, component selection, layout,
interaction, and framework UI copy. Module contracts own domain fields,
domain labels, permissions, and workflow behavior.

Use this authority order:

1. An explicit user decision or approved feature design.
2. This UI contract.
3. The public framework component contract.
4. A canonical example named by this contract.

Nearby routes are domain evidence. They are not visual authority. When the
framework cannot express this contract, record `framework-gap: <capability>`
and stop before a local substitute or framework edit.

## Select the applicable branch

- Read [surfaces.md](surfaces.md) for page shells, navigation headers, page
  actions, filters, and layout.
- Read [forms.md](forms.md) for form fields, defaults, labels, actions, and
  structured input selection.
- Read [collections.md](collections.md) for tables, card collections, empty
  states, `ChipFilter`, and `Tabs`.

Read only the branches used by the changed surface.

## Shared rules

### Standard path

Start with the standard framework surface. Add route-local composition only
for a proved domain workflow or a recorded framework gap. Keep each visible
pattern owned by one framework component.

### Interface text

Use labels, values, validation, and workflow instructions that help the user
complete the current task. A field dependency is expressed by the field state,
such as disabled or hidden, and its label. Add instructional prose only when
an approved requirement proves that the controls cannot communicate the rule.

The standard submit label is `Submit`. The standard collection view labels are
`Table` and `Cards`.

### Spacing

Use the framework spacing of the selected surface. A group of peer cards uses
`gap-2`. A group of peer actions uses `flex flex-row gap-2`.

### Variations

A variation needs an approved domain or accessibility reason. Record the
reason beside the feature design or plan and verify the visible result. A
nearby implementation is not a reason.
