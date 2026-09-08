# Frontend field and input contract

Read this reference before a Carta web resource or form edit. The framework
owns the normal input behavior. A module declares only its domain difference.

## Public field shape

```ts
{
  label,
  display: { read?, renderer?, props?, format? },
  table: { ... },
  detail: { ... },
  form: { renderer?, props?, source?, validate?, write?, behavior? },
}
```

- If `display.read` is absent, display reads `record[field.key]`.
- If `form.write` is absent, submit keeps the control value unchanged.
- Do not add `(value) => value` or an identity display reader.
- There is no public top-level field `read` or `write`.
- Field `form.validate` replaces the renderer's default non-empty control-shape
  validation.

## Value and validation flow

```text
loaded API value
  -> framework prepares the control value
  -> live control draft
  -> input default or form.validate
  -> form.write, when present, on a shallow submit copy
  -> resource schema
  -> action business validators
```

Field authors do not configure another load or write path. The framework owns
the loaded-value preparation, and `form.write` remains the only field writer.

The framework runs field writers before the submit callback or resource
action. Submit callbacks and actions send their input unchanged. They do not
run a full-payload writer. Readiness checks inspect control values and do not
write them.

For a nested custom form block that has a non-asset submit conversion, put one
writer on the owning top-level field. Do not also write its child fields or
write the block again during submit. Stored assets use the API object contract
and have no submit writer.

The live draft always keeps the control value. A writer is pure, changes only
its field on the submit copy, and never replaces a preview or selected record
in the live draft.

The input contract owns basic non-empty control shape:

- `number`: a finite JavaScript number;
- single `image`: one canonical asset object;
- `image` with `multi: true`: an array of canonical asset objects;
- `lookup` or `select` with `multi: true`: an array of exact selection record
  objects from the field schema. The schema must use
  `selectionValues(itemSchema)`; the framework rejects a missing or different
  schema and rejects `form.write`.

Empty values go to the resource schema. The resource schema owns requiredness
and the final submitted shape. Use action validators only for extra business
rules. For example, a number renderer already rejects text; use
`form.validate` only to replace that rule with a domain rule such as 1–15.

Built-in override parameters are typed from the renderer. Number callbacks
receive `number`; single and multi image callbacks receive their different
asset types; multi lookup receives a record array. An arbitrary custom
renderer receives `unknown` until its own contract narrows it.

## Objects and identifiers

Do not apply one identifier rule to all inputs:

- Image and file controls keep the full canonical asset object, or an array of
  those objects in multi mode, and submit it unchanged. A retained upload uses
  the API `storedAssetSchema` for reads and `storedAssetInput` for writes. The
  backend extracts the validated `id`; the field has no `form.write`.
- A database-backed single relation keeps its scalar ID or code as the write
  field. The API also returns the named relation object for display, and
  `display.read` reads its label. Do not fetch only to label it.
- A lookup field keeps the source resource identity separate from its `pick` and
  `view` keys. Use the source identity for detail, CRUD, and cache operations.
  When a pre-filled value uses a different picked key, load it through a loader
  that accepts that key or through returned list records. Never pass `pick` as a
  detail ID. Check a pre-filled lookup in the focused Playwright journey.
- A multi lookup or select keeps the exact selected records in the live draft
  and sends them unchanged. The backend extracts identity fields only at the
  persistence boundary, then sends current labels in the same record array.
  Do not map these values to IDs and do not add a field writer.

The API owns the stored-asset HTTP value. `storedAssetSchema` defines the exact
object, `storedAssetInput` extracts its upload key for persistence, and
`storedAsset()` creates fresh read values. The app asset adapter validates this
object and maps its fixed `id`, `url`, `name`, `mimeType`, `size`, and
`updatedAt` fields to the generic input contract. It does not accept raw keys,
external URLs, partial objects, nested envelopes, or compatibility aliases. A multi
file field uses an object array and submits the array unchanged.

The renderer/schema compatibility diagnostic skips its mismatch error only when
the field has `form.write`. Keep compatibility metadata private to the
framework.

## Check the boundary

Trace one loaded value through the control, submit and stored result. For a
changed conversion, check a value that differs across those stages. For a
lookup, check a pre-filled selection and an invalid parent reference. For an
asset, check that reload retains its preview and submit sends the canonical
object. Use the [verification strategy](verification-strategy.md) to select
checks; repeated assertions of field configuration do not prove this flow.
