import { describe, expect, it } from 'vitest'
import { errorMessage } from '../data/normalize'

describe('errorMessage', () => {
  it('returns the server message from a thrown payload', () => {
    expect(errorMessage({ message: 'Nama sudah dipakai' }, 'Gagal.')).toBe('Nama sudah dipakai')
  })

  it('returns the caller fallback for a non-record, non-Error value', () => {
    expect(errorMessage('boom', 'Silabus could not be loaded.')).toBe('Silabus could not be loaded.')
    expect(errorMessage(undefined, 'Request failed.')).toBe('Request failed.')
  })
})
