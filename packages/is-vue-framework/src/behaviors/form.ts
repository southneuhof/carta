import { missingBehavior, type FrameworkFormBehaviors } from '@southneuhof/is-vue-framework/adapters/behaviors'

export function defaultBeforeSubmit({ formData }: { formData: object }, behavior?: FrameworkFormBehaviors) {
  return behavior?.beforeSubmit?.({ formData }) ?? formData
}

export async function defaultOnSubmit({ payload, method, targetAPI, type }: { payload: object; method: 'put' | 'post'; targetAPI: string; type: 'create' | 'update' }, behavior?: FrameworkFormBehaviors) {
  const onSubmit = behavior?.onSubmit
  if (!onSubmit) missingBehavior('form.onSubmit')
  return onSubmit({ payload, method, targetAPI, type })
}

export function defaultOnSuccess({ payload, response }: { payload: object; response: object }, behavior?: FrameworkFormBehaviors) {
  return behavior?.onSuccess?.({ payload, response }) ?? { payload, response }
}

export function defaultOnError({ payload, error }: { payload: object; error: any }, behavior?: FrameworkFormBehaviors) {
  return behavior?.onError?.({ payload, error }) ?? { payload, error }
}

export async function defaultFormGetData({ getAPI, id, searchParameters }: { getAPI: string; id?: string | number | string[]; searchParameters?: object }, behavior?: FrameworkFormBehaviors) {
  const getDetailData = behavior?.getDetailData
  if (!getDetailData) missingBehavior('form.getDetailData')
  return getDetailData({ getAPI, id, searchParameters })
}
