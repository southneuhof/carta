import type { Context } from 'hono'
import { validationError } from '@southneuhof/sprindle'

/**
 * Reads a JSON object body. An empty body is `{}` (DELETE with no payload),
 * malformed JSON and non-object bodies answer 400 instead of masquerading as
 * field-validation issues.
 */
export async function readJsonBody(c: Context): Promise<Record<string, unknown>> {
  const raw = await c.req.text()
  if (!raw.trim()) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw validationError('Request body is not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw validationError('Request body must be a JSON object.')
  return parsed as Record<string, unknown>
}
