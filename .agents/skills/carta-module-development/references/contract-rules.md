# Carta contract rules

The approved `design.md` owns module-specific decisions. This file owns shared
cross-layer rules. The routed layer skills own their implementation details.

- **Labels:** Use the user-facing labels in the approved design. Keep
  capitalization, punctuation, singular and plural terms, validation, and
  workflow text consistent across surfaces.
- **Behavior:** The approved design is the behavior contract, including
  disabled, hidden, read-only, and action states. Backend authorization does
  not replace a required visible state.
- **Field names:** Keep database, API schema, operation, resource, and route field names aligned.
- **Field contract:** Use `display.read` for computed display values and `form.write` only for submit conversion. Actions send the written input unchanged. Do not add top-level field `read` or `write`, identity callbacks, action-wide writers, or manual copies of built-in input validation. Read [frontend-field-contract.md](frontend-field-contract.md) before web resource or form work.
- **Relations:** API owns display metadata. Add a named relation object to the API select schema, define the Drizzle relation, and load it for list/detail and returned create/update. Web keeps `projectId`/`categoryCode`-style write fields and uses `display.read` for names. Do not fetch only to label a database-owned reference. Fixed non-database enums may use a local lookup; `display.read` does not fetch.
- **File ownership:** The shared API file routes and `apps/api/src/storage/s3.ts` own upload, list, download, and delete operations. For each domain file field, prove whether persistence owns a retained upload key, an approved external URL, or a child row. A retained upload uses `storedAssetSchema` for public reads and `storedAssetInput` for writes; compose nullable and array rules at the field. Database columns keep strict upload-key strings. Public schemas compose nested public schemas. Standard models use `storedAssetModel(publicSchema)`, and custom record boundaries use `publicRecord` or `publicRecords`. The install-scope response guard projects exact upload keys with one request-scoped origin, including nested objects and arrays. Only file-manager code can call `storedAsset()` directly to attach metadata that it already has. The web keeps the complete object or object array and submits it unchanged. Its central asset adapter accepts only canonical values and selects `id`, `url`, `name`, `mimeType`, `size`, and `updatedAt`; fields select only the `image` or `file` renderer. File-list prefixes and external URLs use separate explicit schemas. Do not add a module upload route, module asset mapper, request-URL parameter for projection, second asset schema, frontend writer, alias lookup, path parser, or URL builder.
- **Multi-value ownership:** A multi lookup or select uses `selectionValues(exactItemSchema)` on both request and response. Keep the exact record array in the web draft and do not add `form.write`. A service extracts identity fields only at the join-table boundary and reads current labels from the database. Owned child arrays keep their child schema and editor. Assets and complete JSON documents keep their own contracts.
- **Query selections:** Encode selection object arrays as JSON query values in web actions and parse them with `selectionQuery(itemSchema)` in the API. Do not use comma-separated scalar lists for a multi lookup or select filter.
- **Migration boundary:** A multi lookup or select migration changes the API and service boundary when the old field used scalar IDs. Update the field name, exact item schema, persistence mapping, read mapping, tests, and Playwright journey together. Do not keep an ID-array alias or a compatibility writer.
- **Surfaces:** Use route-based `ListView`/`DetailView`/`FormView` for standard CRUD and child CRUD. Use a custom endpoint or route-local `Form` only for an approved domain workflow.
- **Parent-child detail navigation:** The parent detail route renders its
  detail surface, permission-aware route tabs, and the child router view. Put
  child list, detail, and form routes below the parent detail route. Use
  `ChipFilter` only when choices filter one collection.
- **Independent actions:** Standard CRUD does not require a complete set. The
  approved design selects list, detail, create, update, and delete separately.
  Implement only those actions and their routes.
- **ChipFilter:** When approved choices only change the query for one
  `ListView`, render `ChipFilter` in its filters slot. Preserve approved labels,
  order, default, and query semantics. Keep `Tabs` for independent surfaces.
- **Lookup sources:** Use owning resource `list` and `detail` as lookup sources. Do not add consumer-owned options route or ask users to enter IDs. Read [frontend-field-contract.md](frontend-field-contract.md) for the separate lookup-key and resource-identity rule.
- **Permission matrix:** The approved `design.md` owns the
  complete permission matrix. It lists exact permission codes, realms, and
  route/action mappings. Use its entries in `catalog.ts`, route guards,
  navigation, seed, and tests. Read [permission naming rules](../../api-conventions/references/standard-crud.md) for standard verbs and custom URL actions.
- **Navigation:** Sidebar visibility requires an
  `apps/web/src/manifest/navigation.ts` entry with the route name, permission,
  title, and correct group. A route alone does not make a module visible.
- **Soft delete:** The design must state list, detail, mutation, and recovery
  behavior separately. Do not infer deleted-detail behavior from the term
  `soft delete`.
- **Validation:** The input contract validates the non-empty control shape. The resource schema owns requiredness and the final submitted shape. Action validators own extra business rules. `form.validate` replaces the input default; it does not run on top of it. Do not duplicate these rules in route components.
- **Query cache:** All web server reads go through the framework query cache (`useLoader` + `collectionKey`/`recordKey`, or framework surfaces). No bare `.run()` fetches in `onMounted`; mutations invalidate via `resource.invalidate()`. Standard CRUD is exposed as direct resource methods (`resource.list()`), custom actions under `resource.actions`. See [web-query-cache.md](web-query-cache.md).
- **No extras:** Do not add compatibility routes, generic CRUD endpoints, broad CRUD test matrices, or pixel-comparison tests.
