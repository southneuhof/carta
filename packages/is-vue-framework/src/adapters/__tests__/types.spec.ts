import { describe, expect, it } from 'vitest'
import type { FrameworkBehaviors } from '../behaviors'
import type { FrameworkPluginOptions } from '../plugin'

describe('type surface', () => {
  it('keeps runtime sanity for type-only assertions', () => {
    expect(true).toBe(true)
  })
})

const pluginOptionsValid: FrameworkPluginOptions = {
  extension: { inputs: {} },
  config: {},
  defaults: {},
  behaviors: {},
}

const behaviorsValid: FrameworkBehaviors = {
  form: {},
  table: {},
}

void pluginOptionsValid
void behaviorsValid

// @ts-expect-error FrameworkBehaviors no longer accepts defaults
const behaviorsInvalid: FrameworkBehaviors = { defaults: {} }
void behaviorsInvalid

// @ts-expect-error plugin options no longer accepts top-level inputs
const pluginOptionsInvalidInputs: FrameworkPluginOptions = { inputs: {} }
void pluginOptionsInvalidInputs

// @ts-expect-error defaults no longer accepts config
const pluginOptionsInvalidDefaultsConfig: FrameworkPluginOptions = { defaults: { config: {} } }
void pluginOptionsInvalidDefaultsConfig

// @ts-expect-error plugin options should reject unknown top-level keys
const pluginOptionsInvalidKey: FrameworkPluginOptions = { parser: {} }
void pluginOptionsInvalidKey
