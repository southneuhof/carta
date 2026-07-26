/**
 * Dynamic field behavior.
 *
 * Each declared behavior option is evaluated inside one Vue `computed` over the
 * reactive draft, so it subscribes to exactly the draft properties it reads and
 * is re-tracked on every run. There is no depends-on list, which removes the
 * legacy stale-dependency-list bug class by construction.
 *
 * Behavior decides presence, schemas decide validity: a field whose `visible`
 * evaluates false contributes no value to the submitted draft. Form applies
 * that rule (plan 004); it is defined here as data.
 */
import { computed, watch, type ComputedRef, type WatchStopHandle } from 'vue'
import type { FieldBehavior, FieldContext } from '../contracts'
import type { ResolvedSurfaceField } from './resolve'

export interface FieldBehaviorState {
  visible: boolean
  disabled: boolean
  props: Record<string, unknown>
  /** Present only for `derived` fields. */
  derived?: unknown
}

export interface BehaviorRuntimeOptions<TDraft extends object> {
  fields: readonly ResolvedSurfaceField<Record<string, unknown>, TDraft>[]
  /** A reactive draft; reads inside behavior functions become subscriptions. */
  draft: TDraft
  context?: FieldContext
  /** Reports observed draft dependencies per field; used by devtools. */
  onDependencies?: (key: string, dependencies: readonly string[]) => void
}

export interface BehaviorRuntime<TDraft extends object> {
  state: (key: string) => ComputedRef<FieldBehaviorState>
  /** Keys whose `visible` currently evaluates true. */
  visibleKeys: ComputedRef<string[]>
  /** The draft with hidden fields removed — what is submitted and validated. */
  visibleDraft: ComputedRef<Partial<TDraft>>
  /** Applies `derived` values and `resetWhen` cascades; returns a stop handle. */
  connect: (write: (key: string, value: unknown) => void) => WatchStopHandle
}

const behaviorOptionNames = ['visible', 'disabled', 'props', 'derived', 'resetWhen'] as const

export function assertBehavior(key: string, behavior: FieldBehavior<never> | undefined): void {
  if (!behavior) return
  for (const [option, value] of Object.entries(behavior)) {
    if (!(behaviorOptionNames as readonly string[]).includes(option)) {
      throw new Error(`[is-vue-framework] Unknown behavior option "${option}" on field "${key}".`)
    }
    if (typeof value !== 'function') {
      throw new Error(
        `[is-vue-framework] behavior.${option} on field "${key}" must be a function; constants belong in the static projection.`,
      )
    }
  }
  if (behavior.derived && behavior.resetWhen) {
    throw new Error(`[is-vue-framework] Field "${key}" declares both behavior.derived and behavior.resetWhen.`)
  }
}

function shallowEqual(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const leftKeys = Object.keys(left)
  if (leftKeys.length !== Object.keys(right).length) return false
  return leftKeys.every((key) => Object.is(left[key], right[key]))
}

/**
 * Records which draft properties an evaluation read, and refuses writes, so
 * impure behavior functions fail loudly instead of corrupting the draft.
 */
function recordingDraft<TDraft extends object>(
  draft: TDraft,
  key: string,
  seen: Set<string>,
): TDraft {
  return new Proxy(draft, {
    get(target, property, receiver) {
      if (typeof property === 'string') seen.add(property)
      return Reflect.get(target, property, receiver)
    },
    set(_target, property) {
      throw new Error(
        `[is-vue-framework] behavior on field "${key}" tried to write draft.${String(property)}; behavior functions must be pure.`,
      )
    },
    deleteProperty(_target, property) {
      throw new Error(
        `[is-vue-framework] behavior on field "${key}" tried to delete draft.${String(property)}; behavior functions must be pure.`,
      )
    },
  }) as TDraft
}

export function createBehaviorRuntime<TDraft extends object>(
  options: BehaviorRuntimeOptions<TDraft>,
): BehaviorRuntime<TDraft> {
  const context = options.context ?? {}
  for (const field of options.fields) assertBehavior(field.key, field.behavior)

  const evaluate = <TResult>(key: string, run: (draft: TDraft, value: unknown) => TResult): TResult => {
    const seen = new Set<string>()
    const result = run(recordingDraft(options.draft, key, seen), options.draft[key])
    options.onDependencies?.(key, [...seen])
    return result
  }

  const states = new Map<string, ComputedRef<FieldBehaviorState>>()

  for (const field of options.fields) {
    const behavior = field.behavior
    let lastProps: Record<string, unknown> = field.props

    states.set(
      field.key,
      computed<FieldBehaviorState>(() => {
        const visible = behavior?.visible
          ? evaluate(field.key, (draft, value) => behavior.visible!({ draft, value, context }))
          : true
        const disabled = behavior?.disabled
          ? evaluate(field.key, (draft, value) => behavior.disabled!({ draft, value, context }))
          : false

        let props = field.props
        if (behavior?.props) {
          const dynamic = evaluate(field.key, (draft, value) => behavior.props!({ draft, value, context }))
          props = { ...field.props, ...dynamic }
        }
        if (shallowEqual(props, lastProps)) props = lastProps
        else lastProps = props

        const state: FieldBehaviorState = { visible, disabled, props }
        if (behavior?.derived) {
          state.derived = evaluate(field.key, (draft, value) => behavior.derived!({ draft, value, context }))
        }
        return state
      }),
    )
  }

  const state = (key: string) => {
    const found = states.get(key)
    if (!found) throw new Error(`[is-vue-framework] No behavior state for field "${key}".`)
    return found
  }

  const visibleKeys = computed(() => options.fields.filter((field) => state(field.key).value.visible).map((field) => field.key))

  const visibleDraft = computed(() => {
    const result: Record<string, unknown> = {}
    const visible = new Set(visibleKeys.value)
    for (const [key, value] of Object.entries(options.draft)) {
      const known = options.fields.some((field) => field.key === key)
      if (known && !visible.has(key)) continue
      result[key] = value
    }
    return result as Partial<TDraft>
  })

  const connect = (write: (key: string, value: unknown) => void): WatchStopHandle => {
    const stops: WatchStopHandle[] = []

    for (const field of options.fields) {
      const behavior = field.behavior
      if (!behavior) continue

      if (behavior.derived) {
        stops.push(
          watch(
            () => state(field.key).value.derived,
            (value) => {
              if (Object.is(options.draft[field.key], value)) return
              write(field.key, value)
            },
            { immediate: true },
          ),
        )
      }

      if (behavior.resetWhen) {
        stops.push(
          watch(
            () => evaluate(field.key, (draft, value) => behavior.resetWhen!({ draft, value, context })),
            (next, previous) => {
              if (Object.is(next, previous)) return
              write(field.key, undefined)
            },
          ),
        )
      }
    }

    return () => stops.forEach((stop) => stop())
  }

  return { state, visibleKeys, visibleDraft, connect }
}
