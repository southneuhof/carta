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

Persisted file and image values use one backend-neutral shape:

```ts
{
  kind: 'file',
  path: '/storage/public/report.pdf',
  url: 'https://cdn.example/report.pdf',
  name: 'report.pdf',
  size: 1234,
  mimeType: 'application/pdf',
  updatedAt: '2026-07-29T00:00:00.000Z',
}
```

Framework inputs validate this shape and do not read backend aliases such as
`content_type`, `filename`, or `updated_at`. Convert those fields in app-owned
upload `toModel` and File Manager value adapters.

## Controlled inputs

Core Form owns draft data, touched state, and schema validation. Reusable
controls intentionally expose Vue's controlled `modelValue` /
`update:modelValue` contract. Renderer adapter maps core `value` and `setValue`
to that contract. This boundary is stable, not deprecated; business validation
remains core/schema-owned.
