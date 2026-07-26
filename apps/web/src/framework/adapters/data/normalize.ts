import type { CollectionResult, DataAdapter, RecordResult, SubmitError, ValidationIssue } from '@southneuhof/is-vue-framework'

/**
 * Backend conventions of this project, kept out of framework components.
 *
 * Collections arrive as `{ data, total, limit }`; records arrive either bare or
 * wrapped in `{ data }`. Validation failures arrive as `{ message, errors }`,
 * where `errors` maps a property path to messages.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeCollection<TRecord extends object>(payload: unknown): CollectionResult<TRecord> {
  if (Array.isArray(payload)) return { data: payload as TRecord[] }
  if (!isRecord(payload) || !Array.isArray(payload.data)) return { data: [] }

  const total = typeof payload.total === 'number' ? payload.total : undefined
  const pageSize = typeof payload.limit === 'number' ? payload.limit : undefined
  const page = typeof payload.page === 'number' ? payload.page : undefined

  return {
    data: payload.data as TRecord[],
    meta: {
      total,
      page,
      pageSize,
      totalPage: total != null && pageSize ? Math.ceil(total / pageSize) : undefined,
    },
  }
}

export function normalizeRecord<TRecord extends object>(payload: unknown): RecordResult<TRecord> {
  if (!isRecord(payload)) return undefined
  if (isRecord(payload.data)) return payload.data as TRecord
  return payload as TRecord
}

function collectIssues(errors: unknown): ValidationIssue[] | undefined {
  if (!isRecord(errors)) return undefined
  const issues: ValidationIssue[] = []
  for (const [path, messages] of Object.entries(errors)) {
    const list = Array.isArray(messages) ? messages : [messages]
    for (const message of list) {
      if (typeof message !== 'string') continue
      issues.push({ path: path.split('.'), message })
    }
  }
  return issues.length ? issues : undefined
}

export function normalizeError(error: unknown): SubmitError {
  if (error instanceof Error) return { message: error.message }
  if (isRecord(error)) {
    const message = typeof error.message === 'string' ? error.message : 'Request failed.'
    const issues = collectIssues(error.errors)
    return issues ? { message, issues } : { message }
  }
  return { message: 'Request failed.' }
}

export const dataAdapter: DataAdapter = { normalizeCollection, normalizeRecord, normalizeError }
