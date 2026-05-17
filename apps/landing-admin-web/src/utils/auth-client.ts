import config from '@/config'

export const adminApiBaseURL = (import.meta.env.VITE_API_BASE_URL || config.apiUrl).replace(/\/+$/, '')
const authBaseURL = `${adminApiBaseURL}/auth`

type AuthClientResult<T> = Promise<{ data: T | null; error: { message?: string } | null }>

async function parseAuthResponse<T>(response: Response): AuthClientResult<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    return {
      data: null,
      error: payload ?? { message: response.statusText || 'Authentication request failed' },
    }
  }

  return {
    data: payload as T,
    error: null,
  }
}

export const authClient = {
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) =>
      parseAuthResponse(
        await fetch(`${authBaseURL}/sign-in/email`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify({ email, password }),
        }),
      ),
  },
  signOut: async () =>
    parseAuthResponse(
      await fetch(`${authBaseURL}/sign-out`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      }),
    ),
}
