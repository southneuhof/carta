# @southneuhof/is-vue-framework

> This repository is a read-only mirror of the package source from
> https://github.com/southneuhof/carta.
>
> Please open issues and pull requests against the Carta monorepo.

Vue components and contracts for South Neuhof web applications.

## Framework 2.0 configuration

Use one plugin options object:

```ts
app.use(FrameworkPlugin, {
  adapters,
  renderers,
  inputProps: appInputProps,
  fieldDefaults: { table: { align: 'start' } },
})
```

`fieldDefaults` define uniform surface policy. Renderer defaults and source
translation belong in `inputProps`.

## Schema and resource API

Schemas describe the standard web data contract and validation:

```ts
const schema = defineSchema({
  identity: 'id',
  record: { schema: recordSchema },
  query: { schema: querySchema },
  create: { schema: createSchema },
  update: { schema: updateSchema },
})
```

When the runtime schema is Zod, use the schema-only bridge. It infers the
parsed value, including a transform output:

```ts
const createSchema = fromZod(
  z.object({ name: z.string() }).transform(({ name }) => ({ name: name.trim() })),
)
```

Do not pass a second type argument to `fromZod`. A raw form type is local to a
real function boundary. It is not a second type for the standard resource.

Resources contain named action blocks:

```ts
const fields = defineFields(schema, {
  name: { label: 'Name', form: { renderer: 'text' } },
})

const resource = defineResource(schema, {
  key: 'records',
  actions: {
    list: { run: list, fields: [fields.name] },
    detail: { run: detail, fields: [fields.name] },
    create: { run: create, fields: [fields.name] },
    update: { run: update, fields: [fields.name] },
    delete: { run: remove },
    verify: { run: verify },
  },
})
```

Standard action objects are the View props and the only standard execution
path:

```vue
<ListView v-bind="resource.list()" />
<DetailView v-bind="resource.detail({ id })" />
<FormView v-bind="resource.create()" />
<FormView v-bind="resource.update({ id })" />
```

```ts
await resource.delete({ id }).run()
await resource.actions.verify.run(input)
```

Standard fields are schema-bound references. Define shared behavior once with
`defineFields(schema, definitions)`, use `display`, `table`, `detail`, and
`form` projections for surfaces, and select references in action order. A
terminal partial `.override({...})` handles one local difference. Custom
actions contain only `run`.

## Core components

`Table`, `Detail`, and `Form` are resource-agnostic. They accept native props
and can be used directly for custom screens. `ListView`, `DetailView`, and
`FormView` add page chrome and forward the same native props.

`DialogForm` composes `Dialog` with core `Form`:

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

Successful submission closes by default. Use `beforeClose` for Cancel and
dismiss decisions. The route owns navigation, dialogs, confirmations, and
toasts.

## Transport boundary

The framework package has no Hono source or Hono dependency. `apps/web` owns
its typed Hono contract adapter, action helper, response normalization, and
service or fetch functions.
