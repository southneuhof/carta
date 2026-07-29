# Legacy model config to field catalog

Framework 2.0 is a clean break. There are no compatibility converters, fallback
readers, field-name normalization, or legacy config aliases. Each resource owns
one explicit `FieldCatalog`; schemas own validation and resources own initial
data, accessors, and options.

`FrameworkPlugin` accepts optional `fieldDefaults` for uniform surface policy:

```ts
app.use(FrameworkPlugin, {
  fieldDefaults: {
    shared: { props: { dense: true } },
    table: { align: 'start' },
  },
})
```

These defaults apply to every field on a surface. Key-specific reuse belongs in
named catalog presets such as `timestampField(label)`.

| Legacy config | Catalog equivalent | Notes |
| --- | --- | --- |
| `fieldsAlias[key]` | `label` | Shared across every surface. |
| `fieldsProxy[key]` | `read: (record) => ...` | Only where the display value genuinely differs from the key. |
| `fieldsType[key].type` / `inputConfig[key].type` | `table.renderer` / `detail.renderer` / `form.renderer` | Never `type`: value types belong to schemas. |
| `fieldsType[key].props` / `inputConfig[key].props` | `<surface>.props` | Shallow-merges across precedence layers. |
| `fieldsParse[key]` | `display.format` | Formatting is display metadata, not a renderer. |
| `fieldsUnit[key]` | `display.props` of the renderer | The unit is a renderer option. |
| `fieldsAlign[key]` | `table.align` | Table-only projection. |
| `fields: [...]` | the `fields` argument of the consuming prop bag | Order lives at the call site, never in the catalog. |
| field absent from a surface list | `table: false` / `detail: false` / `form: false` | Absence of a projection means available; `false` excludes. |
| `dependency.fields` | *(deleted)* | Dependencies are tracked automatically; the manual list was a stale-list footgun. |
| `dependency.visibility.validator` | `form.behavior.visible` | Hidden fields contribute no value to the submitted draft. |
| `dependency.disabled.validator` | `form.behavior.disabled` | |
| `dependency.props.generator` | `form.behavior.props` | Shallow-merges over static `form.props`. |
| `dependency.inputConfig.generator` | `form.behavior.props` | The two legacy generators collapse into one concept. |
| `dependency.value.generator` | `form.behavior.derived` or `form.behavior.resetWhen` | `derived` when the value is always computed; `resetWhen` when an edit should be cleared on a dependency change. |
| `dependency.*.default` | the static projection | `behavior` accepts only functions. |

Rules that have no legacy equivalent:

- `behavior` functions are pure and synchronous. Writing to the draft or
  performing I/O inside one throws in development.
- `derived` and `resetWhen` on the same field is a contradictory definition and
  throws.
- Behavior decides presence, schemas decide validity (plan 003).
