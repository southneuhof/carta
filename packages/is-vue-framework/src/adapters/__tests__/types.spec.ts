import { describe, expect, it } from 'vitest'
import type { FrameworkRuntime } from '../../runtime'

describe('type surface', () => {
  it('keeps runtime sanity for type-only assertions', () => {
    expect(true).toBe(true)
  })
})

const runtimeValid: FrameworkRuntime = {
  crud: {},
  form: {},
  table: {},
}
void runtimeValid

// @ts-expect-error runtime rejects unknown capability groups
const runtimeInvalid: FrameworkRuntime = { unknown: {} }
void runtimeInvalid
