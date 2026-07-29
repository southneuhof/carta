import { inject, type InjectionKey } from 'vue'

export interface InputPropsResolutionContext {
  field?: { key: string; label?: string }
}

export interface InputPropsAdapter<TSource = never, TProps extends Record<string, unknown> = Record<string, unknown>> {
  defaults?: Readonly<Partial<TProps>>
  normalize?: (source: TSource, context: InputPropsResolutionContext) => Readonly<Partial<TProps>>
}

type AdapterMap = Record<string, InputPropsAdapter<any, any>>

export interface InputPropsRegistry {
  resolve: (renderer: string, input: {
    source?: unknown
    props?: Record<string, unknown>
    context?: InputPropsResolutionContext
  }) => Record<string, unknown>
}

function objectResult(value: unknown, renderer: string, field?: string): Record<string, unknown> {
  const suffix = field ? ` on field "${field}"` : ''
  const prototype = value && typeof value === 'object' ? Object.getPrototypeOf(value) : undefined
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || typeof (value as { then?: unknown }).then === 'function'
    || (prototype !== Object.prototype && prototype !== null)
  ) {
    throw new Error(`[is-vue-framework] Input props normalizer for "${renderer}"${suffix} must synchronously return a plain object.`)
  }
  return value as Record<string, unknown>
}

export function createInputPropsRegistry<const TAdapters extends AdapterMap>(adapters: TAdapters): InputPropsRegistry {
  const copied = new Map<string, InputPropsAdapter>(Object.entries(adapters).map(([key, adapter]) => [key, {
    ...adapter,
    ...(adapter.defaults ? { defaults: { ...adapter.defaults } } : {}),
  }]))
  const resolve: InputPropsRegistry['resolve'] = (renderer, input) => {
    const adapter = copied.get(renderer)
    const context = input.context ?? {}
    const field = context.field?.key
    const hasSource = Object.prototype.hasOwnProperty.call(input, 'source')
    if (!adapter) {
      if (hasSource) throw new Error(`[is-vue-framework] Input props renderer "${renderer}"${field ? ` on field "${field}"` : ''} has no source normalizer.`)
      return { ...(input.props ?? {}) }
    }
    const defaults = adapter.defaults ? { ...adapter.defaults } : {}
    if (!hasSource) return { ...defaults, ...(input.props ?? {}) }
    if (!adapter.normalize) throw new Error(`[is-vue-framework] Input props renderer "${renderer}"${field ? ` on field "${field}"` : ''} has no source normalizer.`)
    const normalized = objectResult((adapter.normalize as (source: unknown, context: InputPropsResolutionContext) => unknown)(input.source, context), renderer, field)
    return { ...defaults, ...normalized, ...(input.props ?? {}) }
  }
  return { resolve }
}

export function emptyInputPropsRegistry(): InputPropsRegistry {
  return createInputPropsRegistry({})
}

export const inputPropsRegistryKey: InjectionKey<InputPropsRegistry> = Symbol.for('is-vue-framework-input-props')

export function useInputPropsRegistry(): InputPropsRegistry {
  const registry = inject(inputPropsRegistryKey)
  if (!registry) throw new Error('[is-vue-framework] FrameworkPlugin is not installed.')
  return registry
}
