import type { InputConfig } from '@southneuhof/is-data-model'

export interface FrameworkGlobalDefaults {
  fieldsAlias?: Record<string, string>
  fieldsParse?: Record<string, string>
  fieldsProxy?: Record<string, string>
  fieldsType?: Record<string, { type?: string; props?: any }>
  fieldSlots?: Record<string, any>
}

export interface FrameworkTableDefaults extends FrameworkGlobalDefaults {
  fieldsClass?: Record<string, string>
  fieldsHeaderClass?: Record<string, string>
  fieldsAlign?: Record<string, 'start' | 'center' | 'end'>
}

export interface FrameworkDetailDefaults extends FrameworkGlobalDefaults {}

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

const DEFAULT_MODE = 'default'

const BASELINE_TABLE_CONFIG: Required<FrameworkTableDefaults> = {
  fieldsAlias: {},
  fieldsClass: {},
  fieldsHeaderClass: {},
  fieldsParse: {},
  fieldsProxy: {},
  fieldsType: {},
  fieldsAlign: {},
  fieldSlots: {},
}

const BASELINE_DETAIL_CONFIG: Required<FrameworkDetailDefaults> = {
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

export const defaultTableConfig: Required<FrameworkTableDefaults> = cloneValue(BASELINE_TABLE_CONFIG)
export const defaultDetailConfig: Required<FrameworkDetailDefaults> = cloneValue(BASELINE_DETAIL_CONFIG)
export const defaultFormConfig: Required<FrameworkFormDefaults> = cloneValue(BASELINE_FORM_CONFIG)
const config: Required<FrameworkAppConfigDefaults> = cloneValue(BASELINE_APP_CONFIG)
export let mode = DEFAULT_MODE

function isPlainObject(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== 'object') return false
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

function mergeGlobalDefaults(nextGlobal: FrameworkGlobalDefaults) {
  if (nextGlobal.fieldsAlias) {
    deepMergeInto(defaultTableConfig.fieldsAlias, nextGlobal.fieldsAlias)
    deepMergeInto(defaultDetailConfig.fieldsAlias, nextGlobal.fieldsAlias)
    deepMergeInto(defaultFormConfig.fieldsAlias, nextGlobal.fieldsAlias)
  }
  if (nextGlobal.fieldsParse) {
    deepMergeInto(defaultTableConfig.fieldsParse, nextGlobal.fieldsParse)
    deepMergeInto(defaultDetailConfig.fieldsParse, nextGlobal.fieldsParse)
  }
  if (nextGlobal.fieldsProxy) {
    deepMergeInto(defaultTableConfig.fieldsProxy, nextGlobal.fieldsProxy)
    deepMergeInto(defaultDetailConfig.fieldsProxy, nextGlobal.fieldsProxy)
  }
  if (nextGlobal.fieldsType) {
    deepMergeInto(defaultTableConfig.fieldsType, nextGlobal.fieldsType)
    deepMergeInto(defaultDetailConfig.fieldsType, nextGlobal.fieldsType)
  }
  if (nextGlobal.fieldSlots) {
    deepMergeInto(defaultTableConfig.fieldSlots, nextGlobal.fieldSlots)
    deepMergeInto(defaultDetailConfig.fieldSlots, nextGlobal.fieldSlots)
  }
}

export function applyFrameworkDefaults(nextDefaults?: FrameworkDefaultsInput) {
  if (!nextDefaults) return

  if (nextDefaults.global) mergeGlobalDefaults(nextDefaults.global)
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
