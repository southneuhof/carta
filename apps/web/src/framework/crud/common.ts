export async function parseRpcResponse<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) throw payload
  return payload as T
}

export function serializeIdentity(id: string | number | Array<string | number>) {
  return Array.isArray(id) ? id.join('/') : String(id)
}
