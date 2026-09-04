const POST_LOGIN_REDIRECT_KEY = 'aiso_post_login_redirect'

function normalizeInternalRoute(path: string): string | null {
  const trimmedPath = String(path || '').trim()
  if (!trimmedPath) return null
  if (!trimmedPath.startsWith('/')) return null
  if (trimmedPath.startsWith('//')) return null
  if (trimmedPath.startsWith('/unauthenticated/login')) return null
  return trimmedPath
}

function safeGetSessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch (_) {
    return null
  }
}

export function savePostLoginRedirect(path: string): void {
  const normalizedPath = normalizeInternalRoute(path)
  if (!normalizedPath) return

  const storage = safeGetSessionStorage()
  if (!storage) return
  storage.setItem(POST_LOGIN_REDIRECT_KEY, normalizedPath)
}

export function consumePostLoginRedirect(): string | null {
  const storage = safeGetSessionStorage()
  if (!storage) return null

  const storedPath = storage.getItem(POST_LOGIN_REDIRECT_KEY)
  if (!storedPath) return null
  storage.removeItem(POST_LOGIN_REDIRECT_KEY)
  return normalizeInternalRoute(storedPath)
}

export function getCurrentHashRouteForRedirect(): string | null {
  const hash = window.location.hash || ''
  if (hash.startsWith('#/')) {
    return normalizeInternalRoute(hash.slice(1))
  }

  const pathname = window.location.pathname || ''
  const search = window.location.search || ''
  return normalizeInternalRoute(`${pathname}${search}`)
}
