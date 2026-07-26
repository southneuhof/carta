/**
 * Shared field catalog.
 *
 * One catalog entry projects into table, detail, and form surfaces. Absence of
 * a projection means "available by default"; an explicit `false` excludes the
 * field from that surface. Field order lives in the consuming prop bag
 * (`fields: ['name', ...]`), never duplicated inside the catalog.
 */
import type { FieldDefinition } from '../contracts'

export type FieldCatalogInput<
  TRecord extends object,
  TDraft extends object = TRecord,
> = Record<string, FieldDefinition<TRecord, TDraft>>

/**
 * Curried so the record type is explicit while catalog keys stay literal:
 * `defineFields<Incident>()({ incident_name: { ... } })`.
 */
export function defineFields<
  TRecord extends object,
  TDraft extends object = TRecord,
>() {
  return <TCatalog extends FieldCatalogInput<TRecord, TDraft>>(catalog: TCatalog): TCatalog => catalog
}

export type CatalogKey<TCatalog> = Extract<keyof TCatalog, string>
