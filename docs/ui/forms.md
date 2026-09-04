# Forms

Read this file for form fields, defaults, labels, actions, and structured input
selection.

## Standard form path

Use `FormView` for every independent form page, including import and workflow
forms. It supplies the standard navigation header and form layout. Use `Form`
or `DialogForm` only inside a surface that is not an independent page.

The form action region is bottom-right. Its standard submit label is `Submit`.
`Form`, `FormView`, `DialogForm`, and form composites use the framework UI
default unless an approved workflow requires another label.

## Field defaults

Select each schema field needed by the action. When a selected field has no
resource override, the app field default owns its renderer, label, props, and
initial value. This rule applies to recurring fields such as `active`.

A resource defines a recurring field only when that resource needs behavior
that differs from the app default. The presence of the field in the action is
not an override.

Use the registered framework renderer for each value. Calendar dates use the
framework `date` renderer. Arrays of form-owned editable rows use the
framework `table` renderer and `TableInput`.

## Labels and instructions

The outer form field owns the visible label, required state, error, help text,
and grid span. A nested input or custom field renders the control only. This
keeps one visible label for one field.

Use disabled, hidden, and validation states to communicate field dependencies.
Instructional prose follows the interface-text rule in [README.md](README.md).

## Select a field implementation

Use the first option that expresses the complete value contract:

1. A registered renderer with its source, props, and behavior.
2. A framework composite.
3. The `table` renderer and `TableInput` for editable row arrays.
4. A module-owned custom field composed from framework inputs.
5. A new framework primitive after an approved framework gap.

The selection decision ends at step 4. After selecting a custom field, read
the custom field contract from the `build-resource-form` skill in
`southneuhof/skills`
(`npx skills@latest add southneuhof/skills --skill build-resource-form`)
for its implementation contract.

## Custom form pages

A custom body does not change the page shell, action alignment, submit label,
field-label ownership, or renderer selection rules. Compose the minimum domain
layout inside the standard form surface.
