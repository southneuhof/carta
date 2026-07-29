import type { CreateConfig, InputConfig } from '@southneuhof/is-data-model'
import { defaultFormConfig } from '../../../configs/_defaults'
import { api } from '../../../lib/api'
import { LookupInput } from '../../inputs/LookupInput'
import { SelectInput } from '../../inputs/SelectInput'
import { TextInput } from '../../inputs/TextInput'
import { ImageInput } from '../../inputs/ImageInput'
import { FileInput } from '../../inputs/FileInput'
import type { FormInputComponent } from '../../inputs/types'

export type FormMode = 'create' | 'update'

export type FormOnSubmitParams = {
  payload: Record<string, any>
  method: 'put' | 'post'
  targetAPI: string
  type: FormMode
}

export type FormGetDetailParams = {
  getAPI: string
  id?: string | number
  searchParameters?: Record<string, any>
}

export type FormOnSuccessParams = {
  formData: Record<string, any>
  res: Record<string, any>
}

export type FormOnErrorParams = {
  formData: Record<string, any>
  error: unknown
}

function parseURL(url: string, prefix = '', suffix = '') {
  if (url.endsWith('?custom')) return url.slice(0, -7)
  return `${prefix}${url}${suffix}`
}

function normalizeObject(payload: unknown): Record<string, any> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }
  return payload as Record<string, any>
}

export function defaultBeforeSubmit({ formData }: { formData: Record<string, any> }): Record<string, any> {
  return formData
}

export async function defaultOnSubmit({ payload, method, targetAPI, type }: FormOnSubmitParams): Promise<Record<string, any>> {
  const endpoint = parseURL(targetAPI, '', type === 'create' ? '/create' : '/update')
  if (!endpoint) throw new Error('Form target API is required.')

  if (method === 'post') {
    return normalizeObject(await api.post(endpoint, payload))
  }

  if (method === 'put') {
    return normalizeObject(await api.put(endpoint, payload))
  }

  throw new Error(`Unsupported method: ${method}`)
}

export function defaultOnSuccess({ formData, res }: FormOnSuccessParams) {
  return { formData, res }
}

export function defaultOnError({ formData, error }: FormOnErrorParams) {
  return { formData, error }
}

export async function defaultFormGetData({ getAPI, id, searchParameters }: FormGetDetailParams): Promise<Record<string, any>> {
  if (!id) return {}
  const response = await api.detail(getAPI, id, searchParameters || {})
  return normalizeObject((response as any)?.data ?? response)
}

export const componentTypeMap: Record<string, FormInputComponent> = {
  text: TextInput,
  textarea: TextInput,
  password: TextInput,
  file: FileInput,
  image: ImageInput,
  select: SelectInput,
  radio: TextInput,
  date: TextInput,
  daterange: TextInput,
  month: TextInput,
  year: TextInput,
  tag: TextInput,
  currency: TextInput,
  switch: TextInput,
  checkbox: TextInput,
  lookup: LookupInput,
  location: TextInput,
  'multi-location': TextInput,
  'rich-text': TextInput,
  'icon-select': TextInput,
  table: TextInput,
  time: TextInput,
  'dynamic-form': TextInput,
  number: TextInput,
  'checkbox-group': TextInput,
  separator: TextInput,
  canvas: TextInput,
  'file-manager': TextInput,
  custom: TextInput,
} as const

export function createMergedInputConfig(inputConfig?: InputConfig): InputConfig {
  return {
    ...defaultFormConfig.inputConfig,
    ...(inputConfig || {}),
  }
}

export type FormDefaultsCreateConfig = CreateConfig
