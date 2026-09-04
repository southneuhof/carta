import { sprindleOnError } from '@southneuhof/sprindle/hono'
import type { Context } from 'hono'

/**
 * Postgres reports failed unique constraints as SQLSTATE 23505. Drizzle wraps
 * driver errors, so the code may sit on the error itself or anywhere along its
 * `cause` chain.
 */
export function isUniqueViolation(error: unknown): boolean {
  return findUniqueViolation(error) !== undefined
}

function findUniqueViolation(error: unknown): { constraint?: string } | undefined {
  for (let current: unknown = error; current instanceof Error; current = (current as { cause?: unknown }).cause) {
    if ((current as { code?: unknown }).code === '23505') return current as { constraint?: string }
  }
  return undefined
}

function uniqueMessage(violation: { constraint?: string }): string {
  const constraint = violation.constraint ?? ''
  // Postgres names simple unique constraints `<table>_<column>_key`; an
  // explicitly named Drizzle constraint ends in `_unique`. Either way the
  // trailing segments carry the column name.
  const stripped = constraint.replace(/_(?:unique|key)$/, '')
  const column = stripped.split('_').pop()
  return column ? `${column.replace(/_/g, ' ')} must be unique.` : 'The value already exists.'
}

export async function onError(error: Error, c: Context) {
  const violation = findUniqueViolation(error)
  if (violation) {
    return c.json({ error: 'validation_error', message: uniqueMessage(violation), issues: undefined }, 400)
  }
  return sprindleOnError(error, c)
}
