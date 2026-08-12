# Form Field Types

Use this reference when choosing a form renderer or mapping a value between a
record and a form draft. The input catalog and its test are the current list of
built-in form renderers:

- `apps/web/src/routes/(demo)/input-catalog/inputCatalogDemo.ts`
- `apps/web/src/routes/(demo)/input-catalog/index.route.spec.ts`
- `packages/is-vue-framework/src/renderers/form.ts`

Do not invent a renderer key. For resource-backed standard lists, inspect
`apps/web/src/framework/inputs/registry.ts` and a nearby current resource.

## Contents

- [Shared rules](#shared-rules)
- [Scalar and choice fields](#scalar-and-choice-fields)
- [Date and time fields](#date-and-time-fields)
- [Files, locations, and rich values](#files-locations-and-rich-values)
- [Structured and custom fields](#structured-and-custom-fields)

## Shared rules

Every field can use `label`, `read`, `write`, and a `form` projection:

```ts
const fields = defineFields(schema, {
  title: {
    label: 'Title',
    form: { renderer: 'text', props: { required: true } },
  },
})
```

Use `source` for static option arrays or a resource-backed standard list. Use
`pick` for the submitted identity and `view` for the display value. Use
`searchParameters` for parent or status filters. Keep server filtering in the
API.

Use `read` when the record has a relation object but the form submits its ID:

```ts
divisionId: {
  label: 'Division',
  read: (record) => record.division?.name,
  form: { source: divisions, props: { pick: 'id', view: 'name', required: true } },
}
```

Add the renderer registered for the source-backed standard list in the nearest
current resource. The exact key is app configuration, not a value to infer.

## Scalar and choice fields

| Renderer | Value | Common props | Current usage |
| --- | --- | --- | --- |
| `text` | string | native input props, `required`, `type` | input catalog; projects resource |
| `textarea` | string | native textarea props, `required` | input catalog; roles resource |
| `password` | string | native input props, `required` | input catalog |
| `number` | number | `min`, `max`, `step`, `required` | input catalog; work-items resource |
| `currency` | number | `currency`, `locale`, numeric props | input catalog |
| `select` | scalar or array | `source`, `pick`, `view`, `multi`, `searchable`, `clearable` | input catalog |
| `radio` | scalar | `source`, `pick`, `view`, `variant`, `direction` | roles resource |
| `checkbox` | boolean | `required` | input catalog |
| `checkbox-group` | array | `source`, `pick`, `view`, `searchParameters` | users resource |
| `switch` | boolean | `required` | roles resource |
| `tag` | string array | `placeholder`, common input props | input catalog |
| `color` | color string | native color input props | input catalog |
| resource-backed standard list | scalar or array | source resource, `pick`, `view`, `multi`, `searchParameters` | divisions resource |

Use a static source only for a small, closed set owned by the form contract:

```ts
const statusOptions = [
  { id: 'open', name: 'Open' },
  { id: 'closed', name: 'Closed' },
] as const

status: { form: { renderer: 'radio', source: statusOptions, props: { required: true } } }
```

Use a resource-backed standard list for database rows, active records, or
parent-filtered records. Its source resource must expose `list` and `detail`.
The list action must return fields used by `pick` and `view`; the detail action
must return the selected record for edit forms.

## Date and time fields

| Renderer | Value | Common props | Current usage |
| --- | --- | --- | --- |
| `date` | date string | `required`, native date props | projects resource |
| `daterange` | two date strings | `locale`, `required` | input catalog |
| `month` | `YYYY-MM` string | `required` | PTS list route |
| `year` | number or year string | `required` | input catalog |
| `time` | time string | native time props | input catalog |

Match the API schema to the value emitted by the input. Use `read` or `write`
when the database stores another representation. Do not format a value in the
form and then silently change its schema type.

## Files, locations, and rich values

| Renderer | Value | Required props or mapping | Current usage |
| --- | --- | --- | --- |
| `file` | asset object or asset array | app upload defaults; `multi`, `accept`, `maxSize` | input catalog; divisions actions |
| `image` | image asset or image asset array | app upload defaults; `limit`, `multi`, `maxSize` | divisions resource |
| `location` | coordinate object | `operations` from the app location adapter | projects resource |
| `multi-location` | coordinate object array | `operations` from the app location adapter | input catalog |
| `rich-text` | HTML or rich text string | renderer props from the current catalog | input catalog |
| `icon-select` | icon name string | current icon options and props | input catalog |

The app upload adapter produces an asset model with `kind`, `path`, `url`,
`name`, `size`, and `mimeType`. Persist the path or the API's declared asset
shape, not a browser `File` object. Use `read` to show an asset and `write` to
submit the retained path when the API stores only the path.

Location inputs need the app's `LocationOperations` object. A common stored
shape is `{ address, lat, lng }`; map the input's `formatted_address` or
`name` to `address` in `write` when required by the entity schema.

## Structured and custom fields

| Renderer | Value | Required props or mapping | Current usage |
| --- | --- | --- | --- |
| `table` | array of row objects | `fields`, `form`, `table`; `rowKey` when reorderable | input catalog |
| `separator` | no submitted value | label or layout props only | input catalog |
| `canvas` | saved image string | `width`, `height`, `onSave` | input catalog |

For a table field, define a small row field catalog and use `DialogForm` inside
the registered table input. The parent schema must validate the complete array.
Use a separate child resource when rows need independent permissions, paging,
or actions.

Use `Form`, `DialogForm`, `Table`, and registered inputs for route-owned custom
surfaces. Keep custom controls in the route. Do not add a local generic input
when a registered renderer or framework composite already fits.
