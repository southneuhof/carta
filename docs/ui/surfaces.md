# Page surfaces

Read this file for page shells, navigation headers, page actions, filters, and
layout.

## Standard pages

| Page | Surface |
|---|---|
| Resource list | `ListView` |
| Resource detail | `DetailView` |
| Create, update, import, or other full-page form | `FormView` |
| Workflow detail with several sections | `NavigationHeader` plus framework cards and composites |

Every independent full page uses the standard navigation header. A custom
workflow changes the page body, not the page chrome.

## Header actions

The header action region is right-aligned and uses `flex flex-row gap-2`.
`ListView` exposes these adjacent slots in this order:

1. `#create-action` is only for replacing the standard Create action. When the
   slot is absent and the resource has a Create route, `ListView` renders the
   standard Create action.
2. `#resource-action` is for Import, Export, Download, and other resource-level
   actions. It remains available when the resource has no Create route.

Content in `#resource-action` does not replace the standard Create action. Use
`#resource-action` when an action does not create one resource record through
the standard Create route.

Row View, Edit, and Delete overrides stay in their named row-action slots.
Each override replaces only the named standard action.

## Form actions

Form actions belong at the bottom-right of the form. Page-header actions do not
duplicate Submit, Import, Download Template, or other actions that complete the
active form workflow.

## Filters

Place collection query controls in `ListView #filters`. A horizontal filter
uses the smallest responsive field span that fits its content. A field takes a
full row only when its control needs the width.

Use [collections.md](collections.md) to select `ChipFilter` or `Tabs`.

## Page composition

Use framework cards, tables, details, forms, dialogs, feedback, and inputs.
Standard surface components own their loading, error, and empty presentation.
Route-local layout owns only the domain sections that the standard surface
cannot express.
