import type { componentTypeMap } from '@southneuhof/is-vue-framework/behaviors/form'
import type { ZodTypeAny } from 'zod'
import type { FieldDependency, ModelFormField } from '@southneuhof/is-data-model'
import type { AsyncComponentLoader, Component } from 'vue'

export type FormTypes = keyof typeof componentTypeMap | 'custom'

export type FormControls = {
  visibility?: {
    validator: (val: any) => any
    default?: boolean
  }
  value?: {
    generator: (val: any) => any
    default?: any
  }
  props?: {
    generator: (val: any, currVal: any) => any
    default?: Object
  }
}

type CustomComponentInput = Component | AsyncComponentLoader

export type FormField = ModelFormField & {
  component?: CustomComponentInput
  props?: Record<string, any> & {
    required?: boolean
    validation?: ZodTypeAny
  }
}
