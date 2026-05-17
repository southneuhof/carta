import { mergeModelConfig, type ModelConfig } from '@southneuhof/is-data-model'
import { defaultDetailConfig, defaultFormConfig, defaultTableConfig } from '@/configs/defaults'

const appModelDefaults: ModelConfig = {
  name: 'default',
  title: 'Default',
  view: {
    list: {
      fieldsAlias: defaultTableConfig.fieldsAlias,
      fieldsParse: defaultTableConfig.fieldsParse,
      fieldsProxy: defaultTableConfig.fieldsProxy,
      fieldsType: defaultTableConfig.fieldsType,
      fieldsClass: defaultTableConfig.fieldsClass,
      fieldsAlign: defaultTableConfig.fieldsAlign,
    },
    detail: {
      fieldsAlias: defaultDetailConfig.fieldsAlias,
      fieldsParse: defaultDetailConfig.fieldsParse,
      fieldsProxy: defaultDetailConfig.fieldsProxy,
      fieldsType: defaultDetailConfig.fieldsType,
    },
  },
  transaction: {
    fieldsAlias: defaultFormConfig.fieldsAlias,
    inputConfig: defaultFormConfig.inputConfig,
  },
}

export function withModelDefaults(model: ModelConfig): ModelConfig {
  return mergeModelConfig(appModelDefaults, model)
}
