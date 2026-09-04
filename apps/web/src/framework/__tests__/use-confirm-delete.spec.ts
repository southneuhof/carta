import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { permissions } from '@/stores/permissions'
import { resourceCan } from '../access'
import { useConfirmDelete } from '../use-confirm-delete'

beforeEach(() => setActivePinia(createPinia()))

describe('resourceCan', () => {
  it('checks the permission declared on the resource', () => {
    const can = resourceCan({ permissions: { create: 'create-x', delete: null } })
    expect(can('list')).toBe(true)
    expect(can('delete')).toBe(true)
  })

  it('follows the identity permission set for declared operations', () => {
    const store = permissions()
    store.build(['create-x'])
    const can = resourceCan({ permissions: { create: 'create-x', update: 'update-x' } })
    expect(can('create')).toBe(true)
    expect(can('update')).toBe(false)
  })
})

describe('useConfirmDelete', () => {
  function setup() {
    return useConfirmDelete(async (target) => target, {
      after: vi.fn(),
      onError: vi.fn(),
      successMessage: 'Gone.',
    })
  }

  it('asks, confirms by running with the asked target, then closes', async () => {
    const del = setup()
    const row = { id: '1' }
    del.ask(row)
    expect(del.target.value).toBe(row)

    const setOpen = vi.fn()
    await del.actions[0]!.onClick(setOpen as (open: boolean) => void)
    expect(del.target.value).toBeNull()
    expect(setOpen).toHaveBeenCalledWith(false)
  })

  it('cancel clears the target without running and closes', () => {
    const run = vi.fn()
    const del = useConfirmDelete(run)
    del.ask({ id: '1' })

    const setOpen = vi.fn()
    del.actions[1]!.onClick(setOpen as (open: boolean) => void)
    expect(del.target.value).toBeNull()
    expect(setOpen).toHaveBeenCalledWith(false)
  })

  it('keeps the dialog open on failure and reports to the route-owned handler', async () => {
    const onError = vi.fn()
    const del = useConfirmDelete(
      async () => {
        throw new Error('boom')
      },
      { onError }
    )
    del.ask({ id: '1' })

    const setOpen = vi.fn()
    await del.actions[0]!.onClick(setOpen as (open: boolean) => void)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(setOpen).not.toHaveBeenCalled()
  })
})
