/**
 * Standard control inference.
 *
 * A standard control renders only when the resource actually has the behavior,
 * a route target exists where one is needed, and UI access allows it. Anything
 * unavailable or denied is absent — never present-but-disabled.
 *
 * Standard controls are list, detail, create, update, and delete. Excel export
 * and print are not standard: applications add them as ordinary custom control
 * descriptors.
 */
import type { AccessAdapter, RecordIdentity, ResourceOperation } from '../contracts'
import type { ViewControl } from '../components/views/controls'
import type { Resource } from './defineResource'

export type StandardControlName = Extract<ResourceOperation, 'list' | 'detail' | 'create' | 'update' | 'delete'>

export type ControlOverride = false | Partial<ViewControl>

export interface StandardControlOptions {
  resource: Resource<never, never, never, never> | Resource
  surface: 'list' | 'detail'
  /** Required for record-scoped controls on the detail surface. */
  id?: RecordIdentity
  record?: Record<string, unknown>
  access?: AccessAdapter
  overrides?: Partial<Record<StandardControlName, ControlOverride>>
  /** Handler for controls with no route target, such as delete. */
  onDelete?: () => void
  labels?: Partial<Record<StandardControlName, string>>
}

const defaultLabels: Record<StandardControlName, string> = {
  list: 'Kembali',
  detail: 'Detail',
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
}

function allowed(options: StandardControlOptions, operation: StandardControlName): boolean {
  const access = options.access
  if (!access) return true
  return access.allows({ operation, permission: options.resource.permissions[operation], record: options.record })
}

export function standardControls(options: StandardControlOptions): ViewControl[] {
  const { resource, overrides = {} } = options
  const controls: ViewControl[] = []

  const add = (name: StandardControlName, base: Omit<ViewControl, 'key' | 'label'>) => {
    const override = overrides[name]
    if (override === false) return
    controls.push({ key: name, label: options.labels?.[name] ?? defaultLabels[name], ...base, ...(override ?? {}) })
  }

  if (options.surface === 'list') {
    if (resource.capabilities.create && resource.routes.create && allowed(options, 'create')) {
      add('create', { to: resource.routes.create, placement: 'primary' })
    }
  }

  if (options.surface === 'detail') {
    if (options.id === undefined) {
      throw new Error(`[is-vue-framework] Detail controls for "${resource.key}" need the record id.`)
    }
    if (resource.routes.list && allowed(options, 'list')) {
      add('list', { to: resource.routes.list, placement: 'secondary' })
    }
    if (resource.capabilities.update && resource.routes.update && allowed(options, 'update')) {
      add('update', { to: resource.routes.update(options.id), placement: 'primary' })
    }
    if (resource.capabilities.delete && allowed(options, 'delete')) {
      add('delete', { onSelect: options.onDelete, placement: 'primary' })
    }
  }

  for (const control of controls) {
    if (!control.to && !control.onSelect) {
      throw new Error(
        `[is-vue-framework] Control "${control.key}" on resource "${resource.key}" has neither a handler nor a route target.`,
      )
    }
  }

  return controls
}
