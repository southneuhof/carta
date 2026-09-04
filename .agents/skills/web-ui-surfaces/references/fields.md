# Fields and forms

Read `docs/ui/forms.md` before this implementation reference. Use
`.agents/skills/build-resource-form/references/form-field-types.md` to select a
renderer or composite.

## Schema-bound fields

Use `defineFields(schema, definitions)` once per module. Put shared labels,
`display.read`, `form.write`, display formats, renderers, sources, and field
behavior there. `display.read` is only for list and detail projections. If it
is absent, the framework reads `record[field.key]`. `form.write` receives the
control value and returns the submitted value for that field; if it is absent,
the framework uses identity behavior. Do not add top-level `read` or `write`
members or identity functions.
Each standard resource action selects field references in its required order.

Every required create or update schema key must have a rendered form field.
Do not rely on a server validation issue for a field that the user cannot see.

Form fields use the renderer registry. Direct input imports are only for a
control outside `Form` composition.

## Database-backed references

The API owns the display value for a database-backed identifier:

- Keep the scalar ID or code field for form values and writes.
- The API read contract supplies the named relation object.
- Define a separate field or a `read` projection for list and detail display.

```ts
const fields = defineFields(schema, {
  projectId: {
    label: 'Project',
    display: { read: (record) => record.project?.name },
    form: {
      renderer: 'lookup',
      source: projects,
      props: { pick: 'id', view: 'name', required: true },
    },
  },
})
```

Do not fetch only to label a record. Do not show a raw ID when the API returns
the relation. `display.read` projects returned data; it does not fetch. Use
`form.write` only when the current backend contract needs a value conversion.

Fixed non-database enums can use an approved local source or label map.

## Lookup sources and dependencies

Use the owning resource's `list` and `detail` actions as the lookup source. Do
not add a consumer-owned options endpoint or load all records into a local
array.

Use `behavior.props` to supply `searchParameters`, `behavior.disabled` for a
missing parent value, and `behavior.resetWhen` when a parent change makes the
current value invalid.

Standard create and update actions add `context.operation` and
`context.permission`. When the backend scopes a lookup by the form action,
read `context.permission` and fail when it is missing. Do not hard-code the
create permission into a field that is also used by update.

## Surface differences

Use one terminal field `.override({ ... })` for one action-specific change.
Its result is final; do not chain overrides. Omit a field when that surface
does not use it.

Keep status options and display renderers beside field definitions so routes
do not repeat label and color maps.
