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
model-config, and config-driven composite Table/Detail/Form/Tree components
were removed. The legacy config-driven `DialogForm` was replaced by a
core-native, resource-agnostic composite; it has no compatibility props or
converters. Schemas own validation; resources own initial data, accessors, and
business options.

## Dialog forms

`DialogForm` composes base `Dialog` with core `Form`. Pass canonical Form props
directly. Dialog visibility uses named `v-model:open`; default `v-model` remains
available for Form draft data.

```vue
<DialogForm
  v-model:open="open"
  :fields="fields"
  :submit="createRecord"
  title="Create record"
  @submitted="handleSubmitted"
>
  <template #trigger="{ setOpen }">
    <Button type="button" @click="setOpen(true)">Create</Button>
  </template>
</DialogForm>
```

Successful submission closes by default; set `close-on-submitted="false"` to
keep the dialog open. Default actions are `Cancel`, `Save`, and `Saving…`;
override their label props or replace the `actions` slot. `loading`,
`load-error`, and `input:<field>` slots pass through to Form, while `header` and
`footer` surround it.

Use `beforeClose` to approve or reject user Cancel/dismiss requests. It receives
the close reason plus Form `dirty`, `submitting`, and `validating` state.
Parent-written `v-model:open` changes remain authoritative and do not call this
guard.
