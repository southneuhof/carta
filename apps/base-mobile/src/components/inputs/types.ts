import type { TextInputProps as RNTextInputProps } from 'react-native'
import type { JSX, ReactNode } from 'react'
import type { DataTableGetData, DataTablePageResponse } from '../composites/DataTable'

export type CommonInputProps = {
  field: string
  label: string
  enableHelperMessage?: boolean
  helperMessage?: string
  disabled?: boolean
  error?: string
}

export type TextInputConstraint = 'number' | 'integer' | 'integerString' | 'decimal' | 'text'

export type TextInputSpecificProps = {
  prefix?: string
  suffix?: string
  icon?: string
  type?: string
  placeholder?: string
  constraint?: TextInputConstraint[]
  renderAction?: () => ReactNode
}

export type SelectOption = Record<string, any>

export type SelectInputSpecificProps = {
  placeholder?: string
  data?: SelectOption[]
  getAPI?: string
  searchParameters?: Record<string, any>
  getData?: (getAPI: string, searchParameters?: Record<string, any>) => Promise<DataTablePageResponse>
  defaultToFirst?: boolean
  pick?: string
  view?: string
  multi?: boolean
  asWhole?: boolean
  transform?: Record<string, string>
  onSelect?: (selected: SelectOption | SelectOption[] | null | undefined) => void
  clearable?: boolean
}

export type LookupOption = Record<string, any>

export type LookupInputGetData = (
  getAPI: string,
  searchParameters?: Record<string, any>
) => Promise<
  | LookupOption[]
  | {
      data?: LookupOption[]
      total?: number
      totalPage?: number
    }
>

export type LookupInputGetDetail = (
  getAPI: string,
  id: string | number,
  searchParameters?: Record<string, any>
) => Promise<LookupOption | null | undefined>

export type LookupInputSpecificProps = {
  getAPI?: string
  searchParameters?: Record<string, any>
  getData?: DataTableGetData
  getDetail?: LookupInputGetDetail
  multi?: boolean
  pick?: string
  fields?: string[]
  fieldsAlias?: Record<string, string>
  fieldsProxy?: Record<string, string>
  fieldsDictionary?: Record<string, Record<string, string>>
  fieldsParse?: Record<string, string>
  fieldsUnit?: Record<string, string>
  transform?: Record<string, string>
  preview?: string
  placeholder?: string
  pageSize?: number
  clearable?: boolean
  dataFormatter?: (data: LookupOption[], multi: boolean, pick: string, fields: string[]) => any
  onCommit?: (data: LookupOption[]) => Promise<void> | void
  onSelectData?: (formData: any, selectedData: LookupOption[], formDataSetter: (newData: any) => void) => void
  formData?: any
  formDataSetter?: (newData: any) => void
}

export type ImageUploadResult = {
  success?: boolean
  path?: string
  data?: string
  url?: string
  thumbnail_url?: string
  thumbnail_url?: string
  [key: string]: any
}

export type ImageInputSpecificProps = {
  maxSize?: number
  disableInformation?: boolean
  multi?: boolean
  limit?: number
  additionalInfo?: string
  transform?: Record<string, string>
  uploadPath?: string
}

export type FileUploadResult = {
  success?: boolean
  path?: string
  data?: string
  url?: string
  filename?: string
  [key: string]: any
}

export type FileInputSpecificProps = {
  accept?: string[]
  maxSize?: number
  multi?: boolean
  uploadPath?: string
}

export type FormInputControlProps = {
  value: unknown
  onChangeValue: (nextValue: any) => void
  onValidationTouch?: () => void
  inputProps?: Omit<RNTextInputProps, 'value' | 'onChangeText' | 'editable' | 'onBlur'>
}

export type FormInputComponentProps =
  & CommonInputProps
  & TextInputSpecificProps
  & SelectInputSpecificProps
  & LookupInputSpecificProps
  & ImageInputSpecificProps
  & FileInputSpecificProps
  & FormInputControlProps

export type FormInputComponent = (props: FormInputComponentProps) => JSX.Element
