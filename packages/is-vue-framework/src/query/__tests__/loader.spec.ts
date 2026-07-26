import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { useLoader } from '../loader'
import { collectionKey } from '../keys'
import { createFrameworkQueryClient, invalidateResourceData } from '../client'
import type { CollectionLoadContext, CollectionResult } from '../../contracts'
import { deferred, flush, withApp } from './harness'

interface Role extends Record<string, unknown> {
  id: number
  name: string
}

const context = { query: {}, searchParameters: {} }

describe('internal loader', () => {
  it('accepts synchronous, offline values through the same contract', async () => {
    const { result, app } = withApp(() =>
      useLoader<CollectionLoadContext, CollectionResult<Role>>({
        key: collectionKey({ resource: 'roles' }),
        context,
        load: () => ({ data: [{ id: 1, name: 'Admin' }] }),
      }),
    )
    await flush()

    expect(result.data.value?.data).toEqual([{ id: 1, name: 'Admin' }])
    app.unmount()
  })

  it('deduplicates loads that share a key even when the closure differs', async () => {
    const load = vi.fn(async () => ({ data: [{ id: 1, name: 'Admin' }] }))
    const queryClient = createFrameworkQueryClient()

    const { app } = withApp(
      () => ({
        first: useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles', query: { page: 1 } }),
          context,
          load: (loadContext) => load(loadContext),
        }),
        second: useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles', query: { page: 1 } }),
          context,
          load: (loadContext) => load(loadContext),
        }),
      }),
      { queryClient },
    )
    await flush(8)

    expect(load).toHaveBeenCalledTimes(1)
    app.unmount()
  })

  it('separates caches for different keys', async () => {
    const load = vi.fn(async ({ query }: CollectionLoadContext) => ({ data: [{ id: Number(query.page), name: 'Role' }] }))
    const queryClient = createFrameworkQueryClient()

    const { app } = withApp(
      () => ({
        first: useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles', query: { page: 1 } }),
          context: { query: { page: 1 }, searchParameters: {} },
          load,
        }),
        second: useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles', query: { page: 2 } }),
          context: { query: { page: 2 }, searchParameters: {} },
          load,
        }),
      }),
      { queryClient },
    )
    await flush(8)

    expect(load).toHaveBeenCalledTimes(2)
    app.unmount()
  })

  it('forwards an abort signal and cancels when the key changes', async () => {
    const page = ref(1)
    const pending = deferred<CollectionResult<Role>>()
    const signals: (AbortSignal | undefined)[] = []
    const queryClient = createFrameworkQueryClient()

    const { app } = withApp(
      () =>
        useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: computed(() => collectionKey({ resource: 'roles', query: { page: page.value } })),
          context: computed(() => ({ query: { page: page.value }, searchParameters: {} })),
          load: ({ signal }) => {
            signals.push(signal)
            return page.value === 1 ? pending.promise : Promise.resolve({ data: [] })
          },
        }),
      { queryClient },
    )
    await flush(6)

    expect(signals[0]).toBeInstanceOf(AbortSignal)
    expect(signals[0]?.aborted).toBe(false)

    page.value = 2
    await flush(6)

    expect(signals[0]?.aborted).toBe(true)
    pending.resolve({ data: [] })
    app.unmount()
  })

  it('normalizes failures through the data adapter', async () => {
    const { result, app } = withApp(
      () =>
        useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles' }),
          context,
          load: async () => {
            throw { message: 'Backend refused.' }
          },
        }),
      {
        queryClient: createFrameworkQueryClient({ retry: 0 }),
        adapters: { data: { normalizeError: (error) => ({ message: `normalized: ${(error as { message: string }).message}` }) } },
      },
    )
    await flush(10)

    expect(result.error.value?.message).toBe('normalized: Backend refused.')
    app.unmount()
  })

  it('does not load when data is supplied externally', async () => {
    const load = vi.fn(async () => ({ data: [] }))
    const { result, app } = withApp(() =>
      useLoader<CollectionLoadContext, CollectionResult<Role>>({
        key: collectionKey({ resource: 'roles' }),
        context,
        load: undefined,
        data: { data: [{ id: 9, name: 'Static' }] },
      }),
    )
    await flush()

    expect(load).not.toHaveBeenCalled()
    expect(result.data.value?.data).toEqual([{ id: 9, name: 'Static' }])
    app.unmount()
  })

  it('rejects supplying both data and load', () => {
    expect(() =>
      withApp(() =>
        useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles' }),
          context,
          load: () => ({ data: [] }),
          data: { data: [] },
        }),
      ),
    ).toThrow('`data` and `load` are alternatives')
  })

  it('invalidates by resource semantics without exposing keys', async () => {
    const load = vi.fn(async () => ({ data: [{ id: 1, name: 'Admin' }] }))
    const unrelated = vi.fn(async () => ({ data: [] }))
    const queryClient = createFrameworkQueryClient({ staleTime: 0 })

    const { app } = withApp(
      () => ({
        roles: useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'roles' }),
          context,
          load,
        }),
        users: useLoader<CollectionLoadContext, CollectionResult<Role>>({
          key: collectionKey({ resource: 'users' }),
          context,
          load: unrelated,
        }),
      }),
      { queryClient },
    )
    await flush(8)
    expect(load).toHaveBeenCalledTimes(1)

    await invalidateResourceData(queryClient, { resource: 'roles' })
    await flush(8)

    expect(load).toHaveBeenCalledTimes(2)
    expect(unrelated).toHaveBeenCalledTimes(1)
    app.unmount()
  })
})
