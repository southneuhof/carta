/** Compile-time tests for the shell control contract. */
import type { ViewControl } from '../controls'

/* Ordinary Vue handlers and plain links are the whole vocabulary. */
const handler: ViewControl = { key: 'refresh', label: 'Segarkan', onSelect: () => undefined }
const link: ViewControl = { key: 'create', label: 'Tambah', to: '/roles/new', placement: 'primary' }
const disabled: ViewControl = { key: 'delete', label: 'Hapus', disabled: true, loading: false }
void handler
void link
void disabled

/* Controls never carry data plumbing or a resource runtime. */
const withLoader: ViewControl = {
  key: 'refresh',
  label: 'Segarkan',
  // @ts-expect-error shells never load data
  load: async () => ({ data: [] }),
}
void withLoader
const withResource: ViewControl = {
  key: 'refresh',
  label: 'Segarkan',
  // @ts-expect-error shells never resolve resources
  resource: 'roles',
}
void withResource
const withCommand: ViewControl = {
  key: 'refresh',
  label: 'Segarkan',
  // @ts-expect-error controls are not commands or action-state
  command: { type: 'refresh' },
}
void withCommand
// @ts-expect-error every control needs a stable key
const withoutIdentity: ViewControl = { label: 'Segarkan' }
void withoutIdentity
