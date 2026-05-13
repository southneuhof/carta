import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureFrameworkBehaviors, resetFrameworkBehaviorsForTests } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { defaultTableGetData } from '../table'
import { defaultOnSubmit } from '../form'

describe('registry-backed framework defaults', () => {
  beforeEach(() => {
    resetFrameworkBehaviorsForTests()
  })

  it('uses registered table behavior', async () => {
    const getData = vi.fn(async () => ({ data: [{ id: 1 }], total: 1, totalPage: 1 }))
    configureFrameworkBehaviors({ table: { getData } })

    await expect(defaultTableGetData('users', { page: 1 })).resolves.toEqual({ data: [{ id: 1 }], total: 1, totalPage: 1 })
    expect(getData).toHaveBeenCalledWith('users', { page: 1 })
  })

  it('throws when required table behavior is missing', async () => {
    await expect(defaultTableGetData('users')).rejects.toThrow('Missing behavior: table.getData')
  })

  it('uses registered form submit behavior', async () => {
    const onSubmit = vi.fn(async () => ({ ok: true }))
    configureFrameworkBehaviors({ form: { onSubmit } })

    await expect(defaultOnSubmit({ payload: { a: 1 }, method: 'post', targetAPI: 'users', type: 'create' })).resolves.toEqual({ ok: true })
    expect(onSubmit).toHaveBeenCalledWith({ payload: { a: 1 }, method: 'post', targetAPI: 'users', type: 'create' })
  })
})
