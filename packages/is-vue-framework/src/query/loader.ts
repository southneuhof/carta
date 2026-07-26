/**
 * Internal execution of the public `load` contract.
 *
 * `load` may return local, synchronous, cached, or remote asynchronous data;
 * this composable adds caching, deduplication, cancellation, retries, and
 * normalized failures without adding public vocabulary. Re-execution is
 * governed by the deterministic query key, never by the identity of the `load`
 * closure — resource prop factories return a fresh closure per call.
 */
import { computed, toValue, unref, type MaybeRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import type { Load, LoadSignalContext, QueryKey, SubmitError } from '../contracts'
import { useFrameworkAdapters } from '../adapters/projectAdapters'

export interface LoaderOptions<TContext extends LoadSignalContext, TResult> {
  key: MaybeRefOrGetter<QueryKey>
  /** Loader context without `signal`; the runtime supplies cancellation. */
  context: MaybeRefOrGetter<Omit<TContext, 'signal'>>
  /** A value or ref — never a getter, since a loader is itself a function. */
  load: MaybeRef<Load<TContext, TResult> | undefined>
  /** Externally controlled data; disables loading entirely. */
  data?: MaybeRef<TResult | undefined>
  enabled?: MaybeRefOrGetter<boolean>
  /** Applied to the loader result before it reaches the component. */
  normalize?: (result: unknown) => TResult
}

export interface LoaderState<TResult> {
  data: Ref<TResult | undefined>
  error: Ref<SubmitError | undefined>
  loading: Ref<boolean>
  refresh: () => Promise<void>
}

export function useLoader<TContext extends LoadSignalContext, TResult>(
  options: LoaderOptions<TContext, TResult>,
): LoaderState<TResult> {
  const adapters = useFrameworkAdapters()
  const externalData = computed(() => unref(options.data))
  const loader = computed(() => unref(options.load))

  if (externalData.value !== undefined && loader.value) {
    throw new Error('[is-vue-framework] `data` and `load` are alternatives; supply only one.')
  }

  const enabled = computed(() => {
    if (externalData.value !== undefined) return false
    if (!loader.value) return false
    return toValue(options.enabled) ?? true
  })

  const query = useQuery<TResult, unknown>({
    queryKey: computed(() => toValue(options.key) as unknown[]),
    enabled,
    queryFn: async ({ signal }) => {
      const load = unref(options.load)
      if (!load) throw new Error('[is-vue-framework] No loader supplied.')
      const context = { ...toValue(options.context), signal } as TContext
      const result = await load(context)
      return options.normalize ? options.normalize(result) : result
    },
  })

  const data = computed(() => (externalData.value !== undefined ? externalData.value : query.data.value)) as Ref<
    TResult | undefined
  >
  const error = computed(() =>
    query.error.value ? adapters.data.normalizeError(query.error.value) : undefined,
  ) as Ref<SubmitError | undefined>
  const loading = computed(() => enabled.value && query.isPending.value) as Ref<boolean>

  return {
    data,
    error,
    loading,
    refresh: async () => {
      await query.refetch()
    },
  }
}
