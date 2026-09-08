# Display fields

Use `defineFields(schema, definitions)` for shared labels and projections.
Select field references in each action's visible order. Use a schema key string
when the app default supplies all needed configuration. Use one terminal
`.override(...)` for an action-specific difference.

`display.read` projects returned data; without it, the field reads its own key.
Keep the submitted relation identity separate from its display label:

```ts
projectId: {
  label: 'Project',
  display: { read: (record) => record.project?.name },
  form: {
    renderer: 'lookup',
    source: projects,
    props: { pick: 'id', view: 'name', required: true },
  },
}
```

Request the relation in the API read contract. Do not fetch one label per row
or replace a missing relation with an unexplained raw ID. A missing optional
value uses the app's empty-value convention.

Keep status labels and formats with their field definition. Static enums can
use local options. Let the schema infer record types; fix a missing projection
at its contract instead of casting records to `any` or fields to `never`.

For form values and dependencies, use
[build-resource-form](../../build-resource-form/SKILL.md).
