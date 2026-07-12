import type { DefaultsConfigBundle } from '@repo/config-meta'

export const baseMobileDefaults: DefaultsConfigBundle = {
  global: {
    fieldSlots: {},
    fieldsProxy: {},
    inputConfig: {},
    fieldsParse: {},
    fieldsAlias: {},
    fieldsType: {},
  },
  table: {
    fieldSlots: {},
    fieldsProxy: {},
    fieldsAlias: {},
    fieldsClass: {},
    fieldsHeaderClass: {},
    fieldsParse: {},
    fieldsType: {},
    fieldsAlign: {},
  },
  detail: {
    fieldSlots: {},
    fieldsProxy: {},
    fieldsAlias: {},
    fieldsParse: {},
    fieldsType: {},
  },
  form: {
    inputConfig: {},
    fieldsAlias: {},
  },
}

export const defaultGlobalConfig = baseMobileDefaults.global
export const defaultTableConfig = baseMobileDefaults.table
export const defaultDetailConfig = baseMobileDefaults.detail
export const defaultFormConfig = baseMobileDefaults.form
