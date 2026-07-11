export type InputConfig = Record<string, {
  type: string
  [key: string]: any
}>

export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

export type DefaultFieldTypeConfig = {
  type: string
  props?: any
}

export type DefaultGlobalConfig = {
  fieldSlots: Record<string, any>
  fieldsProxy: Record<string, string>
  inputConfig: InputConfig
  fieldsParse: Record<string, string>
  fieldsAlias: Record<string, string>
  fieldsType: Record<string, DefaultFieldTypeConfig>
}

export type DefaultTableConfig = {
  fieldSlots: Record<string, any>
  fieldsProxy: Record<string, string>
  fieldsAlias: Record<string, string>
  fieldsClass: Record<string, string>
  fieldsHeaderClass: Record<string, string>
  fieldsParse: Record<string, string>
  fieldsType: Record<string, DefaultFieldTypeConfig>
  fieldsAlign: Record<string, 'start' | 'center' | 'end'>
}

export type DefaultDetailConfig = {
  fieldSlots: Record<string, any>
  fieldsProxy: Record<string, string>
  fieldsAlias: Record<string, string>
  fieldsParse: Record<string, string>
  fieldsType: Record<string, DefaultFieldTypeConfig>
}

export type DefaultFormConfig = {
  inputConfig: InputConfig
  fieldsAlias: Record<string, string>
}

export type DefaultsConfigBundle = {
  global: DefaultGlobalConfig
  table: DefaultTableConfig
  detail: DefaultDetailConfig
  form: DefaultFormConfig
}
