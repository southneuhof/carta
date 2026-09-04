# Collections and selection controls

Read this file for tables, card collections, collection states, `ChipFilter`,
and `Tabs`.

## Collection states

`Table` owns loading, error, empty, and ready states for its collection. The
standard empty state is the application empty state.

A custom collection slot receives only ready, non-empty records. It changes
record presentation and does not replace loading, error, or empty content.
Card collections use `gap-2`.

## Table and card views

Use `Tabs` to switch between presentations of the same loaded records. Its
standard design is the compact segmented control. Use stable string values,
parent-owned state, and these labels:

- `Table`
- `Cards`

The presentation switch does not start another loader or own route query
state.

## ChipFilter

Use `ChipFilter` when a selection changes one collection query. Each use states
its selection contract explicitly:

- `selection="optional"`: selecting the current chip clears the value.
- `selection="required"`: selecting the current chip keeps the value.

The parent supplies the initial value for a required selection. `ChipFilter`
does not select an arbitrary first option and does not add an `All` option.
The route owns query state and resets paging when the filter changes.

## Tabs

Use framework `Tabs` for a local surface or presentation with exactly one
selected item. Use the app routing Tabs component for route navigation. Tabs
are not clearable and do not own router query state.

A required query filter remains a `ChipFilter`; its required selection does
not turn it into a tab surface.
