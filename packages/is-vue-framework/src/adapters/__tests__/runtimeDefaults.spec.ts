import { describe, expect, it, vi } from 'vitest'
import { defaultTableGetData, getTableFieldTypes } from '../../runtimeDefaults'

describe('runtime defaults', () => {
  it('uses supplied table runtime', async () => {
    const getData = vi.fn(async () => ({ data: [{ id: 1 }], total: 1, totalPage: 1 }))
    await expect(defaultTableGetData('users', { page: 1 }, { getData })).resolves.toEqual({ data: [{ id: 1 }], total: 1, totalPage: 1 })
    expect(getData).toHaveBeenCalledWith('users', { page: 1 })
  })

  it('reads supplied renderer map', () => {
    const image = () => null
    expect(getTableFieldTypes({ fieldTypes: { image } }).image).toBe(image)
  })

  it('throws when required runtime capability is missing', async () => {
    await expect(defaultTableGetData('users', undefined, {})).rejects.toThrow('Missing runtime capability: table.getData')
  })
})
