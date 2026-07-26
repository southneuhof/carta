/**
 * Declarative control descriptors for the view shells.
 *
 * A control is a button or a link: an identity, a label, a placement, and
 * either a handler or a navigation target. It is not a command, an action
 * object threaded through state, or a workflow interpreter — anything with
 * branching or side effects belongs in ordinary route code, reached through a
 * handler or a slot.
 *
 * Shells never resolve routes or permissions themselves: `to` is a plain href
 * supplied by the caller, and a control the caller omits simply is not
 * rendered.
 */

export type ControlPlacement = 'primary' | 'secondary' | 'row'

export interface ViewControl {
  /** Stable identity, used as the render key and test hook. */
  key: string
  label: string
  icon?: string
  placement?: ControlPlacement
  disabled?: boolean
  loading?: boolean
  /** Ordinary Vue handler. */
  onSelect?: () => void
  /** Navigation target as a plain href; the route owns route building. */
  to?: string
}

export function controlsAt(controls: readonly ViewControl[] | undefined, placement: ControlPlacement): ViewControl[] {
  return (controls ?? []).filter((control) => (control.placement ?? 'primary') === placement)
}
