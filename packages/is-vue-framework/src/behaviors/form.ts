import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { getInputComponentRegistry } from '../renderers/inputRegistry'

export function defaultBeforeSubmit({ formData }: { formData: object }) {
  return getFrameworkBehaviors().form?.beforeSubmit?.({ formData }) ?? formData
}

export async function defaultOnSubmit({ payload, method, targetAPI, type }: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }) {
  const onSubmit = getFrameworkBehaviors().form?.onSubmit
  if (!onSubmit) missingBehavior('form.onSubmit')
  return onSubmit({ payload, method, targetAPI, type })
}

export function defaultOnSuccess({ payload, response }: { payload: object; response: object }) {
  return getFrameworkBehaviors().form?.onSuccess?.({ payload, response }) ?? { payload, response }
}

export function defaultOnError({ payload, error }: { payload: object; error: any }) {
  return getFrameworkBehaviors().form?.onError?.({ payload, error }) ?? { payload, error }
}

export async function defaultFormGetData({ getAPI, id, searchParameters }: { getAPI: string; id?: string | number; searchParameters?: object }) {
  const getDetailData = getFrameworkBehaviors().form?.getDetailData
  if (!getDetailData) missingBehavior('form.getDetailData')
  return getDetailData({ getAPI, id, searchParameters })
}

export function getComponentTypeMap() {
  return getInputComponentRegistry()
}

export const componentTypeMap = new Proxy({} as ReturnType<typeof getComponentTypeMap>, {
  get(_target, property) {
    return getInputComponentRegistry()[property as string]
  },
  ownKeys() {
    return Reflect.ownKeys(getInputComponentRegistry())
  },
  getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true }
  },
})
