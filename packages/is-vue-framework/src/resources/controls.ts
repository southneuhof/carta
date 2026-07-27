/**
 * Standard control inference — internal to the resource surface factories.
 *
 * A standard control renders only when the resource actually has the behavior,
 * a route target exists where one is needed, and UI access allows it. Anything
 * unavailable or denied is absent — never present-but-disabled.
 *
 * Standard controls are list, detail, create, update, and delete. Excel export
 * and print are not standard: applications add them as ordinary custom control
 * descriptors, through the `extra` block on a factory's `controls` argument.
 *
 * This is not public API. `resource.table()` and `resource.detail({ id })`
 * return the projection already applied, so no caller repeats it per route.
 */
import type { AccessAdapter, RecordIdentity, ResourceOperation } from '../contracts'
import type { ViewControl } from '../components/views/controls'
import type { ResourceAction, ResourceActionKey } from './defineResource'
import type { RouteLocationRaw } from 'vue-router'

export type StandardControlName = Extract<ResourceOperation, ResourceActionKey>

export type ControlOverride = false | Partial<ViewControl>

/**
 * A control the shells can actually act on. A descriptor with neither a target
 * nor a handler used to throw at runtime; it is now unrepresentable.
 */
export type ActionableControl = ViewControl & ({ to: RouteLocationRaw } | { onSelect: () => void })

/** Per-surface control customization: route-authored, never model-declared. */
export interface ControlsArguments {
  overrides?: Partial<Record<StandardControlName, ControlOverride>>
  labels?: Partial<Record<StandardControlName, string>>
  /** Custom controls, appended after the standard set. */
  extra?: readonly ActionableControl[]
}

export interface StandardControlOptions<TIdentity extends RecordIdentity = RecordIdentity> {
  key: string
  actions: Partial<Record<StandardControlName, ResourceAction<TIdentity>>>
  surface: 'list' | 'detail'
  /** Present on the detail surface, where controls are record-scoped. */
  id?: TIdentity
  record?: Record<string, unknown>
  access: AccessAdapter
  /** Delete has no route target, so the surface only offers it with a handler. */
  onDelete?: () => void
  controls?: ControlsArguments
}

const defaultLabels: Record<StandardControlName, string> = {
  list: 'Kembali',
  detail: 'Detail',
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
}

type AccessInput<TIdentity extends RecordIdentity> = Pick<StandardControlOptions<TIdentity>, 'access' | 'record' | 'actions'>

function allowed<TIdentity extends RecordIdentity>(options: AccessInput<TIdentity>, operation: StandardControlName): boolean {
  const action = options.actions[operation]
  return Boolean(action && (action.permission === null || options.access.allows({ operation, permission: action.permission, record: options.record })) && (!action.visible || action.visible({ record: options.record, access: options.access })))
}

export function standardControls<TIdentity extends RecordIdentity>(
  options: StandardControlOptions<TIdentity>,
): ViewControl[] {
  const { actions } = options
  const overrides = options.controls?.overrides ?? {}
  const controls: ViewControl[] = []

  const add = (name: StandardControlName, base: Omit<ViewControl, 'key' | 'label'>) => {
    const override = overrides[name]
    if (override === false) return
    controls.push({
      key: name,
      label: options.controls?.labels?.[name] ?? defaultLabels[name],
      ...base,
      ...(override ?? {}),
    })
  }

  if (options.surface === 'list') {
    const create = actions.create
    if (create?.to && typeof create.to !== 'function' && allowed(options, 'create')) {
      add('create', { to: create.to, placement: 'primary' })
    }
  }

  if (options.surface === 'detail') {
    const list = actions.list
    const update = actions.update
    if (list?.to && typeof list.to !== 'function' && allowed(options, 'list')) {
      add('list', { to: list.to, placement: 'secondary' })
    }
    if (update?.to && options.id !== undefined && allowed(options, 'update')) {
      add('update', { to: typeof update.to === 'function' ? update.to(options.id) : update.to, placement: 'primary' })
    }
    if (actions.delete && options.onDelete && allowed(options, 'delete')) {
      add('delete', { onSelect: options.onDelete, placement: 'primary' })
    }
  }

  controls.push(...(options.controls?.extra ?? []))

  return controls
}
