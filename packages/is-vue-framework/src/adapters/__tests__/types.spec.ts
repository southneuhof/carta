import { describe, expect, it } from 'vitest'
import type { FrameworkBehaviors } from '../behaviors'
import type { FrameworkRuntime } from '../../runtime'

describe('type surface', () => {
  it('keeps runtime sanity for type-only assertions', () => {
    expect(true).toBe(true)
  })
})

const behaviorsValid: FrameworkBehaviors = {
  form: {},
  table: {},
}

void behaviorsValid

const runtimeValid: FrameworkRuntime = { behaviors: behaviorsValid }
void runtimeValid

// @ts-expect-error FrameworkBehaviors no longer accepts defaults
const behaviorsInvalid: FrameworkBehaviors = { defaults: {} }
void behaviorsInvalid

// @ts-expect-error runtime requires behaviors
const runtimeInvalid: FrameworkRuntime = {}
void runtimeInvalid
