import { beforeEach, describe, expect, it } from 'vitest'
import { configureFrameworkBehaviors, getFrameworkBehaviors, missingBehavior, resetFrameworkBehaviorsForTests } from '../behaviors'

describe('framework behavior registry', () => {
  beforeEach(() => {
    resetFrameworkBehaviorsForTests()
  })

  it('stores configured behavior groups', async () => {
    const getData = async () => ({ data: [], total: 0, totalPage: 0 })

    configureFrameworkBehaviors({
      table: { getData },
    })

    expect(getFrameworkBehaviors().table?.getData).toBe(getData)
  })

  it('merges behavior groups without replacing existing members', () => {
    const getData = async () => ({ data: [], total: 0, totalPage: 0 })
    const onDataLoaded = () => {}

    configureFrameworkBehaviors({ table: { getData } })
    configureFrameworkBehaviors({ table: { onDataLoaded } })

    expect(getFrameworkBehaviors().table?.getData).toBe(getData)
    expect(getFrameworkBehaviors().table?.onDataLoaded).toBe(onDataLoaded)
  })

  it('throws a clear missing behavior error', () => {
    expect(() => missingBehavior('table.getData')).toThrow('Missing behavior: table.getData')
  })
})
