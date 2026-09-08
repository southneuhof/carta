# Carta UI conventions

- **Status:** Authoritative
- **Scope:** `apps/web` and UI surfaces from `packages/loom`

These conventions guide page structure, component selection, layout and copy.
Use them as defaults. Module contracts own domain fields, labels, permissions
and workflow behavior; public component APIs own technical requirements.

Use this authority order:

1. An explicit user decision or approved feature design.
2. This UI contract.
3. The public framework component contract.
4. A canonical example named by this contract.

Use nearby routes as examples after checking them against current public APIs.
When a standard surface cannot express the task, compose existing components
locally. Record a missing capability when it affects delivery. Framework package
changes need explicit scope.

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

Start with the standard framework surface. Use its slots, then local composition
when the content or interaction needs it. Reuse shared components and tokens.

### Interface text

Use labels, values, validation, and workflow instructions that help the user
complete the current task. A field dependency is expressed by the field state,
such as disabled or hidden, and its label. Add short help text when the
control state alone does not explain how to proceed.

The standard submit label is `Submit`. The standard collection view labels are
`Table` and `Cards`.

### Spacing

Use the framework spacing of the selected surface. Use `gap-2` as a starting point for peer cards and actions. Let action groups
wrap on narrow screens. Adjust spacing to content density and reading order.

### Variations

Choose layout, density and action labels to fit the task. Check the result at
narrow and wide widths. Record non-obvious choices only when a later maintainer
needs the reason. Ask about changes to product behavior, not routine visual choices.
