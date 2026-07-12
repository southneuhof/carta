import type { InjectionKey } from 'vue'
import type { InputConfig } from '../model-config'

interface FrameworkSharedDefaults {
  fieldsAlias?: Record<string, string>
  fieldsParse?: Record<string, string>
  fieldsProxy?: Record<string, string>
  fieldsType?: Record<string, { type?: string; props?: any }>
  fieldSlots?: Record<string, any>
}

export interface FrameworkGlobalDefaults extends FrameworkSharedDefaults {
  inputConfig?: InputConfig
}

export interface FrameworkTableDefaults extends FrameworkSharedDefaults {
  fieldsClass?: Record<string, string>
  fieldsHeaderClass?: Record<string, string>
  fieldsAlign?: Record<string, 'start' | 'center' | 'end'>
}

export interface FrameworkDetailDefaults extends FrameworkSharedDefaults {}

export interface FrameworkFormDefaults {
  fieldsAlias?: Record<string, string>
  inputConfig?: InputConfig
}

export interface FrameworkAppConfigDefaults {
  apiUrl?: string
  server?: Record<string, any>
  [key: string]: any
}

export interface FrameworkDefaultsInput {
  global?: FrameworkGlobalDefaults
  table?: FrameworkTableDefaults
  detail?: FrameworkDetailDefaults
  form?: FrameworkFormDefaults
  mode?: string
}

type ResolvedTableDefaults = Required<FrameworkTableDefaults>
type ResolvedDetailDefaults = Required<FrameworkDetailDefaults>

export interface ResolvedFrameworkDefaults {
  table: ResolvedTableDefaults
  detail: ResolvedDetailDefaults
  form: Required<FrameworkFormDefaults>
  mode: string
}

export const frameworkDefaultsKey: InjectionKey<ResolvedFrameworkDefaults> = Symbol('is-vue-framework-defaults')

const DEFAULT_MODE = 'default'

const BASELINE_TABLE_CONFIG: ResolvedTableDefaults = {
  fieldsAlias: {},
  fieldsClass: {},
  fieldsHeaderClass: {},
  fieldsParse: {},
  fieldsProxy: {},
  fieldsType: {},
  fieldsAlign: {},
  fieldSlots: {},
}

const BASELINE_DETAIL_CONFIG: ResolvedDetailDefaults = {
  fieldsAlias: {},
  fieldsParse: {},
  fieldsProxy: {},
  fieldsType: {},
  fieldSlots: {},
}

const BASELINE_FORM_CONFIG: Required<FrameworkFormDefaults> = {
  fieldsAlias: {},
  inputConfig: {},
}

const BASELINE_APP_CONFIG: Required<FrameworkAppConfigDefaults> = {
  apiUrl: '',
  server: {},
}

/** @deprecated Install per-app defaults with FrameworkPlugin and use useFrameworkDefaults(). */
export const defaultTableConfig: ResolvedTableDefaults = cloneValue(BASELINE_TABLE_CONFIG)
/** @deprecated Install per-app defaults with FrameworkPlugin and use useFrameworkDefaults(). */
export const defaultDetailConfig: ResolvedDetailDefaults = cloneValue(BASELINE_DETAIL_CONFIG)
/** @deprecated Install per-app defaults with FrameworkPlugin and use useFrameworkDefaults(). */
export const defaultFormConfig: Required<FrameworkFormDefaults> = cloneValue(BASELINE_FORM_CONFIG)
const config: Required<FrameworkAppConfigDefaults> = cloneValue(BASELINE_APP_CONFIG)
export let mode = DEFAULT_MODE

function isPlainObject(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object') return false
  // Vue object components are declarative values, not configuration maps.
  if ('setup' in value || 'render' in value || '__vccOpts' in value) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T
  if (isPlainObject(value)) {
    const cloned: Record<string, any> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      cloned[key] = cloneValue(nestedValue)
    }
    return cloned as T
  }
  return value
}

function deepMergeInto(target: Record<string, any>, source: Record<string, any>) {
  for (const [key, incoming] of Object.entries(source)) {
    if (isPlainObject(incoming)) {
      const existing = target[key]
      if (isPlainObject(existing)) deepMergeInto(existing, incoming)
      else {
        const nextTarget: Record<string, any> = {}
        deepMergeInto(nextTarget, incoming)
        target[key] = nextTarget
      }
      continue
    }
    target[key] = cloneValue(incoming)
  }
}

function applyGlobalDefaults(
  nextGlobal: FrameworkGlobalDefaults,
  targets: {
    table: ResolvedTableDefaults
    detail: ResolvedDetailDefaults
    form: Required<FrameworkFormDefaults>
  },
) {
  if (nextGlobal.fieldsAlias) {
    deepMergeInto(targets.table.fieldsAlias, nextGlobal.fieldsAlias)
    deepMergeInto(targets.detail.fieldsAlias, nextGlobal.fieldsAlias)
    deepMergeInto(targets.form.fieldsAlias, nextGlobal.fieldsAlias)
  }
  if (nextGlobal.fieldsParse) {
    deepMergeInto(targets.table.fieldsParse, nextGlobal.fieldsParse)
    deepMergeInto(targets.detail.fieldsParse, nextGlobal.fieldsParse)
  }
  if (nextGlobal.fieldsProxy) {
    deepMergeInto(targets.table.fieldsProxy, nextGlobal.fieldsProxy)
    deepMergeInto(targets.detail.fieldsProxy, nextGlobal.fieldsProxy)
  }
  if (nextGlobal.fieldsType) {
    deepMergeInto(targets.table.fieldsType, nextGlobal.fieldsType)
    deepMergeInto(targets.detail.fieldsType, nextGlobal.fieldsType)
  }
  if (nextGlobal.fieldSlots) {
    deepMergeInto(targets.table.fieldSlots, nextGlobal.fieldSlots)
    deepMergeInto(targets.detail.fieldSlots, nextGlobal.fieldSlots)
  }
  if (nextGlobal.inputConfig) deepMergeInto(targets.form.inputConfig, nextGlobal.inputConfig)
}

export function resolveFrameworkDefaults(nextDefaults?: FrameworkDefaultsInput): ResolvedFrameworkDefaults {
  const table = cloneValue(BASELINE_TABLE_CONFIG)
  const detail = cloneValue(BASELINE_DETAIL_CONFIG)
  const form = cloneValue(BASELINE_FORM_CONFIG)
  const global = nextDefaults?.global

  if (global) applyGlobalDefaults(global, { table, detail, form })
  if (nextDefaults?.table) deepMergeInto(table, nextDefaults.table as Record<string, any>)
  if (nextDefaults?.detail) deepMergeInto(detail, nextDefaults.detail as Record<string, any>)
  if (nextDefaults?.form) deepMergeInto(form, nextDefaults.form as Record<string, any>)

  return { table, detail, form, mode: nextDefaults?.mode ?? DEFAULT_MODE }
}

/** @deprecated Install per-app defaults with FrameworkPlugin. */
export function applyFrameworkDefaults(nextDefaults?: FrameworkDefaultsInput) {
  if (!nextDefaults) return

  if (nextDefaults.global) applyGlobalDefaults(nextDefaults.global, {
    table: defaultTableConfig,
    detail: defaultDetailConfig,
    form: defaultFormConfig,
  })
  if (nextDefaults.table) deepMergeInto(defaultTableConfig, nextDefaults.table as Record<string, any>)
  if (nextDefaults.detail) deepMergeInto(defaultDetailConfig, nextDefaults.detail as Record<string, any>)
  if (nextDefaults.form) deepMergeInto(defaultFormConfig, nextDefaults.form as Record<string, any>)
  if (typeof nextDefaults.mode === 'string') mode = nextDefaults.mode
}

export function applyFrameworkConfig(nextConfig?: FrameworkAppConfigDefaults) {
  if (!nextConfig) return
  deepMergeInto(config, nextConfig as Record<string, any>)
}

function resetMutableObject(target: Record<string, any>, baseline: Record<string, any>) {
  for (const key of Object.keys(target)) {
    delete target[key]
  }
  deepMergeInto(target, baseline)
}

export function resetFrameworkDefaultsForTests() {
  resetMutableObject(defaultTableConfig, BASELINE_TABLE_CONFIG)
  resetMutableObject(defaultDetailConfig, BASELINE_DETAIL_CONFIG)
  resetMutableObject(defaultFormConfig, BASELINE_FORM_CONFIG)
  resetMutableObject(config, BASELINE_APP_CONFIG)
  mode = DEFAULT_MODE
}

export default config
