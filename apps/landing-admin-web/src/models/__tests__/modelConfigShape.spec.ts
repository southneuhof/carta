import { describe, expect, it } from 'vitest'
import type { ModelConfig } from '@southneuhof/is-data-model'
import { mergeModelConfig } from '@southneuhof/is-data-model'
import * as models from '../index'

const modelList: ModelConfig[] = Object.values(models) as ModelConfig[]

describe('model config shape', () => {
  it('has required name and title branches for all exported models', () => {
    for (const model of modelList) {
      expect(model.name).toBeTruthy()
      expect(model.title).toBeTruthy()
      expect(model.view).toBeDefined()
      expect(model.transaction ?? model.actions).toBeDefined()
    }
  })

  it('mergeModelConfig replaces arrays', () => {
    const base: ModelConfig = {
      name: 'x',
      title: 'x',
      fields: ['a', 'b'],
    }

    const merged = mergeModelConfig(base, { fields: ['a'] })
    expect(merged.fields).toEqual(['a'])
  })

  it('normalizes dependency shape: no legacy dependency.field in model inputConfig', () => {
    for (const model of modelList) {
      const inputConfigs = [
        model.transaction?.inputConfig,
        model.transaction?.create?.inputConfig,
        model.transaction?.update?.inputConfig,
        model.view?.list?.filter?.inputConfig,
      ].filter(Boolean) as Array<Record<string, any>>

      for (const cfg of inputConfigs) {
        for (const field of Object.values(cfg)) {
          if (field && typeof field === 'object' && 'dependency' in field) {
            const dep = (field as any).dependency
            if (dep) {
              expect('field' in dep).toBe(false)
            }
          }
        }
      }
    }
  })
})
