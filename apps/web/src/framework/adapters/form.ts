import services from '@/utils/services'
import { parseURL } from '@southneuhof/is-vue-framework/behaviors/common'

export function beforeSubmit({ formData }: { formData: object }) {
  return formData
}

export async function onSubmit({ payload, method, targetAPI, type }: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }) {
  if (type === 'create') return services[method](parseURL(targetAPI, '', '/create'), payload)
  if (type === 'update') return services[method](parseURL(targetAPI, '', '/update'), payload)
  throw new Error(`[framework-web] Unrecognized submit type: ${type}`)
}

export function onSuccess({ payload, response }: { payload?: object; response?: object }) {
  return { payload, response }
}

export function onError({ payload, error }: { payload?: object; error: any }) {
  return { payload, error }
}

export async function getDetailData({ getAPI, id, searchParameters }: { getAPI: string; id?: string | number; searchParameters?: object }) {
  if (!id) return
  const { data } = await services.detail(getAPI, id, searchParameters || {})
  return data
}
