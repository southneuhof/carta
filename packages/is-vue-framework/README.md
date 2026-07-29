# @southneuhof/is-vue-framework

> This repository is a read-only mirror of the package source from
> https://github.com/southneuhof/carta.
>
> Please open issues and pull requests against the Carta monorepo.

Vue application framework components and patterns for South Neuhof information systems.

## Framework 2.0 configuration

Framework 2.0 supports one canonical plugin options object:

```ts
app.use(FrameworkPlugin, {
  adapters,
  renderers,
  fieldDefaults: {
    shared: { props: { dense: true } },
    table: { align: 'start' },
  },
})
```

`fieldDefaults` are uniform surface policy and apply to every field on that
surface. Key-specific labels, formats, accessors, options, and renderer choices
belong in an explicit `FieldCatalog` or named catalog preset.

This is a clean break. Runtime capability objects, legacy defaults,
model-config, and config-driven composite Table/Detail/Form/DialogForm/Tree
components were removed. No compatibility converter or field-name
normalization exists. Schemas own validation; resources own initial data,
accessors, and business options.
