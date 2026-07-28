<script setup lang="ts">
/**
 * Collection core.
 *
 * Owns rows, namespaced query state, pagination, sorting, loading, empty, and
 * error states. It owns no Card, page header, route navigation, or action
 * control — those belong to the view shells.
 */
import { computed, ref, toRef, watch } from 'vue'
import { getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table'
import draggable from 'vuedraggable'
import Icon from '../base/Icon.vue'
import type { CollectionLoadContext, CollectionResult, QueryValues, TableProps } from '../../contracts'
import { resolveFields } from '../../fields'
import { useLoader, useNamespacedQuery } from '../../query'
import { useRendererRegistry } from '../../renderers/registry'
import { assertSingleDataSource, collectionCacheKey, ownerOf } from './useCoreData'

const props = withDefaults(defineProps<TableProps>(), {
  searchParameters: () => ({}),
  pagination: 'always',
})

const emit = defineEmits<{
  (event: 'update:query', query: QueryValues): void
  (event: 'row-click', record: Record<string, unknown>, index: number): void
  (event: 'row-reorder', rows: Record<string, unknown>[]): void
}>()

assertSingleDataSource('Table', props.data, props.load)

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
})

const rows = computed(() => loaded.data.value?.data ?? [])
const orderedRows = ref<Record<string, unknown>[]>([])
watch(rows, (value) => { orderedRows.value = [...value] }, { immediate: true })
const meta = computed(() => loaded.data.value?.meta)
const empty = computed(() => !loaded.loading.value && !loaded.error.value && rows.value.length === 0)
const totalPage = computed(() => meta.value?.totalPage)
const showPagination = computed(() => totalPage.value != null && props.pagination !== false && (props.pagination === 'always' || totalPage.value > 1))
const sorting = computed(() => {
  const { sort_by, sort } = query.values.value
  return sort_by ? [{ id: String(sort_by), desc: sort === 'desc' }] : []
})
const pagination = computed(() => ({
  pageIndex: Math.max(0, Number(query.values.value.page ?? 1) - 1),
  pageSize: Number(query.values.value.limit ?? 10),
}))
const columns = computed<ColumnDef<Record<string, unknown>>[]>(() =>
  fields.value.map((field) => ({
    id: field.key,
    accessorFn: (record) => (field.read ? field.read(record, {}) : record[field.key]),
    header: field.label,
    enableSorting: field.sortable === true,
    sortDescFirst: false,
  })),
)
const fieldsByKey = computed(() => new Map(fields.value.map((field) => [field.key, field])))
const storageKey = computed(() => `is-table:${props.namespace ?? 'default'}:column-sizes`)
const columnSizes = ref<Record<string, number>>({})
if (typeof window !== 'undefined') {
  try { columnSizes.value = JSON.parse(window.localStorage.getItem(storageKey.value) ?? '{}') } catch { /* malformed storage */ }
}
watch(columnSizes, (value) => { if (typeof window !== 'undefined') window.localStorage.setItem(storageKey.value, JSON.stringify(value)) }, { deep: true })
function resizeColumn(id: string, event: PointerEvent) {
  const parent = (event.currentTarget as HTMLElement).parentElement
  const start = parent?.getBoundingClientRect().width ?? 0
  const startX = event.clientX
  const move = (e: PointerEvent) => { columnSizes.value[id] = Math.max(80, start + e.clientX - startX) }
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
}

function update(patch: QueryValues) {
  query.update(patch)
  emit('update:query', query.values.value)
}

const table = useVueTable<Record<string, unknown>>({
  get data() { return orderedRows.value },
  get columns() {
    return columns.value
  },
  get state() {
    return { sorting: sorting.value, pagination: pagination.value }
  },
  get pageCount() {
    return totalPage.value ?? -1
  },
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true,
  manualPagination: true,
  enableMultiSort: false,
  enableSortingRemoval: false,
  onSortingChange: (updater) => {
    const next = typeof updater === 'function' ? updater(sorting.value) : updater
    const sort = next[0]
    if (!sort) return
    update({ sort_by: sort.id, sort: sort.desc ? 'desc' : 'asc', page: 1 })
  },
  onPaginationChange: (updater) => {
    const next = typeof updater === 'function' ? updater(pagination.value) : updater
    if (next.pageIndex < 0) return
    if (totalPage.value != null && next.pageIndex >= totalPage.value) return
    update({ page: next.pageIndex + 1, limit: next.pageSize })
  },
})

function fieldFor(key: string) {
  return fieldsByKey.value.get(key)
}

function rendererFor(key: string) {
  const renderer = fieldFor(key)?.renderer
  return renderer ? renderers.require(renderer) : undefined
}

defineExpose({ refresh: loaded.refresh, query: query.values })
</script>

<template>
  <div class="is-table flex flex-col gap-3 text-sm text-on-surface">
    <div v-if="loaded.loading.value" class="flex min-h-40 items-center justify-center rounded-xl border border-outline/[16%] bg-surface-container-low px-6 py-10 text-on-surface-variant">
      <slot name="loading">
        <p role="status" aria-live="polite">Memuat…</p>
      </slot>
    </div>

    <div v-else-if="loaded.error.value" class="flex min-h-40 items-center justify-center rounded-xl border border-error/[24%] bg-error-container/[28%] px-6 py-10 text-on-error-container">
      <slot name="error" :error="loaded.error.value">
        <p role="alert">{{ loaded.error.value?.message }}</p>
      </slot>
    </div>

    <div v-else-if="empty" class="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-outline/[32%] bg-surface-container-low px-6 py-10 text-on-surface-variant">
      <slot name="empty">
        <p>No data</p>
      </slot>
    </div>

    <div v-else class="overflow-x-auto rounded-xl">
      <table class="min-w-full border-collapse">
        <thead class="bg-surface-container-high text-on-surface-variant">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              scope="col"
              :style="{ textAlign: fieldFor(header.column.id)?.align }"
              class="whitespace-nowrap text-start border-b border-outline/[16%] px-4 py-2 text-xs font-semibold"
            >
              <button
                v-if="fieldFor(header.column.id)?.sortable"
                type="button"
                class="-mx-2 inline-flex rounded-md px-2 font-semibold transition-colors hover:bg-primary/[10%] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="header.column.toggleSorting()"
              >
                {{ fieldFor(header.column.id)?.label }}
              </button>
              <template v-else>{{ fieldFor(header.column.id)?.label }}</template>
            </th>
            <th
              v-if="$slots['row-actions']"
              scope="col"
              class="w-px whitespace-nowrap border-b border-outline/[16%] px-4 py-2 text-right text-xs font-semibold"
            >
              Aksi
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline/[12%]">
          <tr
            v-for="(row, index) in table.getRowModel().rows"
            :key="row.id"
            class="transition-colors hover:bg-primary/[6%] focus-within:bg-primary/[6%]"
            @click="emit('row-click', row.original, index)"
          >
            <td
              v-for="cell in row.getVisibleCells()"
              :key="cell.id"
              :style="{ textAlign: fieldFor(cell.column.id)?.align }"
              class="whitespace-nowrap px-4 py-3.5 text-on-surface"
            >
              <slot
                :name="`cell:${cell.column.id}`"
                :value="cell.getValue()"
                :record="row.original"
                :field="fieldFor(cell.column.id)"
                :index="index"
              >
                <component
                  :is="rendererFor(cell.column.id)"
                  v-if="fieldFor(cell.column.id)?.renderer"
                  v-bind="fieldFor(cell.column.id)?.props"
                  :value="cell.getValue()"
                  :record="row.original"
                  :field="fieldFor(cell.column.id)"
                  :index="index"
                />
                <template v-else>{{ cell.getValue() ?? '-' }}</template>
              </slot>
            </td>
            <td v-if="$slots['row-actions']" class="w-px px-3 py-2 text-right" @click.stop>
              <slot name="row-actions" :record="row.original" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="showPagination" class="flex items-center justify-end gap-2 px-1 pt-1" aria-label="Pagination">
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md text-xs font-medium text-on-surface transition-colors hover:bg-on-surface/[8%] disabled:cursor-not-allowed disabled:opacity-[.38]"
        :disabled="!table.getCanPreviousPage()"
        @click="table.previousPage()"
      >
        Sebelumnya
      </button>
      <span class="min-w-8 rounded-md text-center text-xs font-medium tabular-nums text-muted">
        {{ pagination.pageIndex + 1 }} / {{ totalPage }}
      </span>
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md text-xs font-medium text-on-surface transition-colors hover:bg-on-surface/[8%] disabled:cursor-not-allowed disabled:opacity-[.38]"
        :disabled="!table.getCanNextPage()"
        @click="table.nextPage()"
      >
        Berikutnya
      </button>
    </nav>
  </div>
</template>
