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
    load: roles.capabilities.list.handler,
    pick: 'id',
    view: 'name',
  },
}
```

`SelectInput`, `RadioGroupInput`, and `CheckboxGroupInput` accept `data` or
`load`, never both. Loader context contains `{ query: {}, searchParameters,
signal }`, matching a standard collection loader. Resource list capability
handlers can therefore be passed directly.
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
    load: roles.capabilities.list.handler,
    loadDetail: roles.capabilities.detail.handler,
  },
}
```

Collection operations return `{ data, meta: { total, totalPage } }`.
`loadDetail` hydrates scalar initial values.

Overtime applicant lookup uses this contract directly:

```ts
{
  load: applicants.capabilities.list.handler,
  loadDetail: applicants.capabilities.detail.handler,
  searchParameters: { sectionId },
}
```

This is the input's native two-operation contract, not a compatibility layer.
Applicant eligibility and section authorization remain server-owned.

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

## Source registry

Fields may now declare opaque app data under `source`; `props` stays native
input props. Install an app-owned `inputProps` registry on `FrameworkPlugin`.
Form resolves registry defaults, normalized source, explicit props, behavior
props, and presentation props in that order. Merges are shallow; presentation
`props: null` clears all resolved input props. Form-owned value, errors,
disabled state, and handlers still win.

```ts
{
  renderer: 'lookup',
  source: sections,
  props: {
    searchParameters: { private: true },
  },
}
```

Resource and field modules author this plain object; they do not import or call
the registry. Application bootstrap installs the registry once, and Form uses it
to translate `source` before invoking the selected renderer.

Normalizers are pure and synchronous: select references and handler functions,
never fetch. Inputs receive no source or resource object. This does not restore
the removed wired runtime; no endpoint discovery or input-side interpretation
is added.
