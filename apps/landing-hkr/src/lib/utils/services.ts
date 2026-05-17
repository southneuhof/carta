
import { browser } from '$app/environment'
import { Apostle } from '@southneuhof/apostle'


export const api = new Apostle({
  //baseURL: 'https://api.compro-hk.byte-labs.tech/api/',
  baseURL: '',
  init: {
    headers: {
      Accept: 'application/json, text/plain, */*',
    }
  },
  effect: {
    onSuccess: async () => {
    },
    onError: async (error) => {
      if (error instanceof Error) error = error
      else if (error instanceof Response) error = (await error.json()) || error
      throw error
    }
  },
  interceptor: (init) => {
    if (!browser) return init
    const token = sessionStorage.getItem('token')
    if (!token) (init.headers as Record<string, string>)['Authorization'] = ``
    if (token && init.headers) (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    return init
  },
  config: {
    // defaultResponseType: 'json',
    inferRequestBodyContentType: true,
    inferResponseBodyContentType: true,
    parseObjectAsJSON: true,
    // cacheResponse: {enabled: true, lifetime: 1000 * 60 * 60}
  }
})
