<script setup lang="ts">
/**
 * Collection core.
 *
 * Owns rows, namespaced query state, pagination, sorting, loading, empty, and
 * error states. It owns no Card, page header, route navigation, or action
 * control — those belong to the view shells.
 */
import { computed, ref, toRef } from 'vue'
import type { CollectionLoadContext, CollectionResult, QueryValues, TableProps } from '../../contracts'
import { resolveFields } from '../../fields'
import { useLoader, useNamespacedQuery } from '../../query'
import { useFrameworkAdapters } from '../../adapters/projectAdapters'
import { useRendererRegistry } from '../../renderers/registry'
import { assertSingleDataSource, collectionCacheKey, ownerOf } from './useCoreData'

const props = withDefaults(defineProps<TableProps>(), {
  searchParameters: () => ({}),
})

const emit = defineEmits<{
  (event: 'update:query', query: QueryValues): void
  (event: 'row-click', record: Record<string, unknown>, index: number): void
}>()

assertSingleDataSource('Table', props.data, props.load)

const adapters = useFrameworkAdapters()
const renderers = useRendererRegistry('table')

const fields = computed(() => resolveFields({ fields: props.fields, surface: 'table' }))

const defaults: QueryValues = { page: 1, limit: 10 }
const controlled = props.query ? ref<QueryValues>({ ...defaults, ...props.query }) : undefined
const query = useNamespacedQuery({
  namespace: toRef(() => props.namespace ?? 'table'),
  defaults,
  local: props.namespace ? undefined : (controlled ?? ref<QueryValues>({ ...defaults })),
})

const owner = ownerOf(props.namespace, 'table')

const loaded = useLoader<CollectionLoadContext, CollectionResult>({
  key: computed(() => collectionCacheKey(owner, query.values.value, props.searchParameters ?? {})),
  context: computed(() => ({ query: query.values.value, searchParameters: props.searchParameters ?? {} })),
  load: computed(() => props.load),
  data: computed(() => (props.data ? { data: props.data } : undefined)),
  normalize: (result) => adapters.data.normalizeCollection(result),
})

const rows = computed(() => loaded.data.value?.data ?? [])
const meta = computed(() => loaded.data.value?.meta)
const empty = computed(() => !loaded.loading.value && !loaded.error.value && rows.value.length === 0)
const page = computed(() => Number(query.values.value.page ?? 1))
const totalPage = computed(() => meta.value?.totalPage)

function update(patch: QueryValues) {
  query.update(patch)
  emit('update:query', query.values.value)
}

function toggleSort(key: string) {
  const descending = query.values.value.sort_by === key && query.values.value.sort === 'asc'
  update({ sort_by: key, sort: descending ? 'desc' : 'asc', page: 1 })
}

function goTo(next: number) {
  if (next < 1) return
  if (totalPage.value != null && next > totalPage.value) return
  update({ page: next })
}

function valueOf(record: Record<string, unknown>, index: number) {
  return fields.value.map((field) => ({
    field,
    value: field.read ? field.read(record, {}) : record[field.key],
    index,
  }))
}

defineExpose({ refresh: loaded.refresh, query: query.values })
</script>

<template>
  <div class="is-table">
    <slot v-if="loaded.loading.value" name="loading">
      <p role="status" aria-live="polite">Memuat…</p>
    </slot>

    <slot v-else-if="loaded.error.value" name="error" :error="loaded.error.value">
      <p role="alert">{{ loaded.error.value?.message }}</p>
    </slot>

    <slot v-else-if="empty" name="empty">
      <p>Tidak ada data.</p>
    </slot>

    <table v-else>
      <thead>
        <tr>
          <th v-for="field in fields" :key="field.key" scope="col" :style="{ textAlign: field.align }">
            <button v-if="field.sortable" type="button" @click="toggleSort(field.key)">{{ field.label }}</button>
            <template v-else>{{ field.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(record, index) in rows" :key="index" @click="emit('row-click', record, index)">
          <td v-for="cell in valueOf(record, index)" :key="cell.field.key" :style="{ textAlign: cell.field.align }">
            <slot :name="`cell:${cell.field.key}`" :value="cell.value" :record="record" :field="cell.field" :index="index">
              <component
                :is="renderers.require(cell.field.renderer)"
                v-if="cell.field.renderer"
                v-bind="cell.field.props"
                :value="cell.value"
                :record="record"
                :field="cell.field"
                :index="index"
              />
              <template v-else>{{ cell.value ?? '-' }}</template>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <nav v-if="totalPage && totalPage > 1" aria-label="Pagination">
      <button type="button" :disabled="page <= 1" @click="goTo(page - 1)">Sebelumnya</button>
      <span>{{ page }} / {{ totalPage }}</span>
      <button type="button" :disabled="page >= totalPage" @click="goTo(page + 1)">Berikutnya</button>
    </nav>
  </div>
</template>
