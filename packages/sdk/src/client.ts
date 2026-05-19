export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type ApiResponseType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text' | 'raw'

export type ApiRequest = {
  method: ApiMethod
  path: string
  query?: Record<string, any>
  body?: unknown
  headers?: Record<string, string>
  responseType?: ApiResponseType
  init?: RequestInit
}

export type CreateAPIClientOptions = {
  baseURL: string
  fetchImpl?: typeof fetch
  defaultHeaders?: Record<string, string>
  getToken?: () => string | undefined | Promise<string | undefined>
  tokenHeader?: string
  tokenPrefix?: string
  onUnauthorized?: (error: { status: number; payload: unknown }) => void | Promise<void>
}

export type ApiClient = {
  dispatch: (request: ApiRequest) => Promise<any>
  get: (path: string, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  post: (path: string, body?: unknown, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  put: (path: string, body?: unknown, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  patch: (path: string, body?: unknown, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  remove: (path: string, body?: unknown, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  raw: (path: string, query?: Record<string, any>, init?: RequestInit) => Promise<Response>
  list: (path: string, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  detail: (path: string, identity?: string | number | Array<string | number>, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  create: (path: string, body?: unknown, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  update: (path: string, body?: unknown, query?: Record<string, any>, init?: RequestInit) => Promise<any>
  dataset: (path: string, query?: Record<string, any>, init?: RequestInit) => Promise<any>
}

function sanitizeQuery(query?: Record<string, any>) {
  if (!query) return undefined
  const clean: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue
    clean[key] = String(value)
  }
  return clean
}

function inferResponseType(contentType: string | null): ApiResponseType {
  if (!contentType) return 'text'
  if (contentType.includes('application/json')) return 'json'
  if (contentType.startsWith('text/')) return 'text'
  return 'blob'
}

async function parseErrorPayload(response: Response): Promise<unknown> {
  try {
    const contentType = response.headers.get('Content-Type')
    if (contentType?.includes('application/json')) return await response.json()
    return await response.text()
  } catch {
    return { status: response.status, statusText: response.statusText }
  }
}

function parseURL(url: string, prefix: string = '', suffix: string = '') {
  if (url.endsWith('?custom')) return url.slice(0, -7)
  return `${prefix}${url}${suffix}`
}

export function createAPIClient(options: CreateAPIClientOptions): ApiClient {
  const fetchImpl = options.fetchImpl ?? fetch

  function buildIdentityPath(identity?: string | number | Array<string | number>) {
    if (identity === null || identity === undefined) return ''
    const segments = Array.isArray(identity) ? identity : [identity]
    return segments.map((segment) => encodeURIComponent(String(segment))).join('/')
  }

  async function request({ method, path, query, body, headers, responseType, init }: ApiRequest) {
    const token = await options.getToken?.()
    const finalHeaders = new Headers({
      ...(options.defaultHeaders || {}),
      ...(headers || {}),
      ...((init?.headers as Record<string, string> | undefined) || {}),
    })

    const isObjectBody = body !== null && body !== undefined && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob)
    if (isObjectBody && !finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json')
    }

    if (token) {
      const header = options.tokenHeader || 'Authorization'
      const prefix = options.tokenPrefix ?? 'Bearer '
      finalHeaders.set(header, `${prefix}${token}`)
    }

    const cleanQuery = sanitizeQuery(query)
    const fullUrl = `${options.baseURL}${path}${cleanQuery ? `?${new URLSearchParams(cleanQuery).toString()}` : ''}`
    const response = await fetchImpl(fullUrl, {
      ...init,
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : isObjectBody ? JSON.stringify(body) : (body as BodyInit),
    })

    if (!response.ok) {
      const payload = await parseErrorPayload(response)
      if (response.status === 401 && options.onUnauthorized) {
        await options.onUnauthorized({ status: response.status, payload })
      }
      throw payload
    }

    const resolvedType = responseType || inferResponseType(response.headers.get('Content-Type'))
    if (resolvedType === 'raw') return response
    return response[resolvedType]()
  }

  return {
    dispatch: request,
    get: (path, query, init) => request({ method: 'GET', path, query, init }),
    post: (path, body, query, init) => request({ method: 'POST', path, body, query, init }),
    put: (path, body, query, init) => request({ method: 'PUT', path, body, query, init }),
    patch: (path, body, query, init) => request({ method: 'PATCH', path, body, query, init }),
    remove: (path, body, query, init) => request({ method: 'DELETE', path, body, query, init }),
    raw: (path, query, init) => request({ method: 'GET', path, query, responseType: 'raw', init }),
    list: (path, query, init) => request({ method: 'GET', path: parseURL(path, '', '/list'), query, init }),
    detail: (path, identity, query, init) => {
      const identityPath = buildIdentityPath(identity)
      return request({ method: 'GET', path: parseURL(path, '', `${identityPath ? `/${identityPath}` : ''}/show`), query, init })
    },
    create: (path, body, query, init) => request({ method: 'POST', path: parseURL(path, '', '/create'), body, query, init }),
    update: (path, body, query, init) => request({ method: 'PUT', path: parseURL(path, '', '/update'), body, query, init }),
    dataset: (path, query, init) => request({ method: 'GET', path: parseURL(path, '', '/dataset'), query, init }),
  }
}
