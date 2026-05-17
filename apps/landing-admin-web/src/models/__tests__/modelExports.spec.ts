import { describe, expect, it } from 'vitest'
import * as models from '../index'

describe('model exports', () => {
  it('exports non-calculator model configs', () => {
    expect(models.menuItemModel.name).toBe('menuItem')
    expect(models.articleModel.name).toBe('article')
    expect(models.formTypeModel.name).toBe('formType')
    expect(models.companyProfileModel.name).toBe('companyProfile')
  })

  it('does not export calculator configs', () => {
    const keys = Object.keys(models)
    expect(keys.some((key) => key.toLowerCase().includes('calculator'))).toBe(false)
  })
})
