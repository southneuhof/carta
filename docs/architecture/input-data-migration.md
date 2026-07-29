# Input data migration

Framework 2.0 removes wired input runtime capabilities. Inputs now receive
backend-neutral loaders and mutation operations directly. No compatibility
aliases remain.

## Options

Before:

```ts
{ renderer: 'select', props: { getAPI: 'roles' } }
```

After:

```ts
{
  renderer: 'select',
  props: {
    load: ({ searchParameters, signal }) =>
      appOptions.list(searchParameters, { signal }),
    pick: 'id',
    view: 'name',
  },
}
```

`SelectInput`, `RadioGroupInput`, and `CheckboxGroupInput` accept `data` or
`load`, never both. Loader context contains `{ searchParameters, signal }`.
Returned values may be a readonly array or `{ data, meta }`.

## Lookup

Lookup uses core Table and strict field metadata:

```ts
{
  renderer: 'lookup',
  props: {
    fields: ['name'],
    view: 'name',
    pick: 'id',
    load: ({ query, searchParameters, signal }) =>
      appRecords.list({ ...searchParameters, ...query }, { signal }),
    loadDetail: ({ id, searchParameters, signal }) =>
      appRecords.detail(id, searchParameters, { signal }),
  },
}
```

Collection operations return `{ data, meta: { total, totalPage } }`.
`loadDetail` hydrates scalar initial values.

## Location

Pass one `LocationOperations` object. Framework records use
`{ id, primaryText, secondaryText }`; vendor fields stay in app adapter.
Autocomplete, detail, and map-config operations receive `AbortSignal`.

## Uploads

```ts
{
  upload: (blob, { destination, signal, onProgress }) =>
    appUploads.send(blob, { destination, signal, onProgress }),
  toModel: (result) => result.persistedValue,
}
```

Upload failures are normalized for UI state. Components own cancellation on
unmount; app owns backend response conversion. Removed runtime members include
`select`, `radioGroup`, `checkboxGroup`, `lookup`, `fileInput`, `imageInput`,
`upload`, `location`, and `fileManager`. Removed components:
`MasterLookupInput` and `DynamicFormInput`.
