<script setup lang="ts">
/**
 * Collection core.
 *
 * Owns rows, namespaced query state, pagination, sorting, loading, empty, and
 * error states. It owns no Card, page header, route navigation, or action
 * control — those belong to the view shells.
 */
import { computed, getCurrentInstance, onBeforeUnmount, ref, toRef, useSlots, watch } from 'vue'
import { getCoreRowModel, useVueTable, type ColumnDef, type ColumnSizingState } from '@tanstack/vue-table'
import type { CollectionLoadContext, CollectionResult, QueryValues, RowReorderPayload, TableProps } from '../../contracts'
import { resolveFields, type ResolvedSurfaceField } from '../../fields'
import { useLoader, useNamespacedQuery } from '../../query'
import { useRendererRegistry } from '../../renderers/registry'
import { assertSingleDataSource, collectionCacheKey, ownerOf } from './useCoreData'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'
import SelectInput from '../inputs/SelectInput.vue'
import { useTablePreferences } from './useTablePreferences'
import Draggable from 'vuedraggable'

const props = withDefaults(defineProps<TableProps>(), {
  searchParameters: () => ({}),
  pagination: 'always',
  pageSizeOptions: () => [10, 25, 50, 100],
  defaultPageSize: 10,
  minColumnWidth: 96,
})

const emit = defineEmits<{
  (event: 'update:query', query: QueryValues): void
  (event: 'update:visibleColumns', columns: string[]): void
  (event: 'update:columnSizing', sizes: ColumnSizingState): void
  (event: 'row-click', record: Record<string, unknown>, index: number): void
  (event: 'row-reorder', payload: RowReorderPayload): void
}>()

assertSingleDataSource('Table', props.data, props.load)

const renderers = useRendererRegistry('table')
const slots = useSlots()

const fields = computed(() => resolveFields({ fields: props.fields, surface: 'table' }))
const fieldKeys = computed(() => fields.value.map((field) => field.key))
const minimumColumnWidth = computed(() => Number.isFinite(props.minColumnWidth) && props.minColumnWidth! > 0 ? props.minColumnWidth! : 96)
const preferences = useTablePreferences(toRef(() => props.namespace), fieldKeys, minimumColumnWidth)
// Runtime VNode props can retain kebab-case names from templates.  Detecting
// control through that object made `:visible-columns` look uncontrolled until
// remount.  The resolved prop is stable for both template and render-function
// callers.
const hasVisibleColumns = props.visibleColumns !== undefined
const hasColumnSizing = props.columnSizing !== undefined
const visibleFields = computed(() => {
  const requested = hasVisibleColumns ? (props.visibleColumns ?? fieldKeys.value) : preferences.visibleKeys.value
  const visible = new Set(requested)
  return fields.value.filter((field) => visible.has(field.key))
})
const columnSizing = ref<ColumnSizingState>({ ...(props.columnSizing ?? preferences.sizes.value) })
const headerElements = new Map<string, HTMLElement>()
const resizingColumn = ref<string>()
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)
watch(() => props.columnSizing, (sizes) => { if (hasColumnSizing && !resizingColumn.value) columnSizing.value = { ...(sizes ?? {}) } })
watch(preferences.sizes, (sizes) => { if (!hasColumnSizing && !resizingColumn.value) columnSizing.value = { ...sizes } })

const defaultPageSize = computed(() => Number.isInteger(props.defaultPageSize) && props.defaultPageSize! > 0 ? props.defaultPageSize! : 10)
const defaults = computed<QueryValues>(() => ({ page: 1, limit: defaultPageSize.value }))
const hasControlledQuery = 'query' in (getCurrentInstance()?.vnode.props ?? {})
const controlled = ref<QueryValues>({ ...defaults.value, ...(props.query ?? {}) })
const query = useNamespacedQuery({
  namespace: toRef(() => props.namespace ?? 'table'),
  defaults,
  // A supplied query always wins, even with a namespace. Namespace then remains
  // cache identity only; controlled state never writes the URL.
  local: hasControlledQuery || !props.namespace ? controlled : undefined,
})

watch(
  () => props.query,
  (value) => {
    if (!hasControlledQuery) return
    controlled.value = { ...defaults.value, ...(value ?? {}) }
  },
  { deep: false },
)

const owner = ownerOf(props.namespace, 'table')
const effectiveQuery = computed<QueryValues>(() => {
  if (!props.reorderable) return query.values.value
  const { page: _page, limit: _limit, sort_by: _sortBy, sort: _sort, ...filters } = query.values.value
  return filters
})

const loaded = useLoader<CollectionLoadContext, CollectionResult>({
  key: computed(() => collectionCacheKey(owner, effectiveQuery.value, props.searchParameters ?? {})),
  context: computed(() => ({ query: effectiveQuery.value, searchParameters: props.searchParameters ?? {} })),
  load: computed(() => props.load),
  data: computed(() => (props.data ? { data: props.data } : undefined)),
})

const rows = computed(() => loaded.data.value?.data ?? [])
const orderedRows = ref<Record<string, unknown>[]>([])
watch(rows, (next) => { orderedRows.value = [...next] }, { immediate: true })
const meta = computed(() => loaded.data.value?.meta)
const empty = computed(() => !loaded.loading.value && !loaded.error.value && rows.value.length === 0)
const totalPage = computed(() => meta.value?.totalPage)
const showPagination = computed(() => !props.reorderable && totalPage.value != null && props.pagination !== false && (props.pagination === 'always' || totalPage.value > 1))
const pageSizeOptions = computed(() => {
  const values = props.pageSizeOptions.filter((value) => Number.isInteger(value) && value > 0)
  const current = Number(query.values.value.limit ?? defaultPageSize.value)
  return [...new Set([...values, current])].sort((left, right) => left - right)
})
const pageSizeItems = computed(() => pageSizeOptions.value.map((value) => ({ id: String(value), name: String(value) })))
const pageStart = computed(() => {
  const total = meta.value?.total
  if (total == null || total === 0) return 0
  return (pagination.value.pageIndex * pagination.value.pageSize) + 1
})
const pageEnd = computed(() => {
  const total = meta.value?.total
  if (total == null || pageStart.value === 0) return 0
  return Math.min(total, pageStart.value + rows.value.length - 1)
})
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
    enableSorting: field.sortable === true && !props.reorderable,
    sortDescFirst: false,
  })),
)

function updateQuery(patch: QueryValues) {
  query.update(patch)
  emit('update:query', query.values.value)
}

function setPageSize(value: unknown) {
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit <= 0) return
  updateQuery({ limit, page: 1 })
}

function setVisibleColumns(next: readonly string[]) {
  const normalized = fieldKeys.value.filter((key) => next.includes(key))
  if (!slots['row-actions'] && normalized.length === 0 && fieldKeys.value.length) return
  if (!hasVisibleColumns) preferences.setVisible(normalized)
  emit('update:visibleColumns', normalized)
}

function normalizeColumnSizing(next: ColumnSizingState) {
  return Object.fromEntries(Object.entries(next)
    .filter(([key, value]) => fieldKeys.value.includes(key) && Number.isFinite(value))
    .map(([key, value]) => [key, Math.max(minimumColumnWidth.value, value)]))
}

function commitColumnSizing(next: ColumnSizingState) {
  const normalized = normalizeColumnSizing(next)
  columnSizing.value = normalized
  if (!hasColumnSizing) preferences.setSizes(normalized)
  emit('update:columnSizing', { ...normalized })
}

function resetColumns() {
  preferences.resetColumns()
  setVisibleColumns(fieldKeys.value)
  columnSizing.value = {}
}

function rowIdentity(record: Record<string, unknown>) {
  if (!props.rowKey) throw new Error('[is-vue-framework] Table reorderable mode requires rowKey.')
  const value = typeof props.rowKey === 'function' ? props.rowKey(record) : record[props.rowKey]
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('[is-vue-framework] Table rowKey must return a string or number.')
  return String(value)
}

watch(orderedRows, (next) => {
  if (!props.reorderable) return
  const identities = next.map(rowIdentity)
  if (new Set(identities).size !== identities.length) throw new Error('[is-vue-framework] Table reorderable rows require unique rowKey values.')
}, { immediate: true })

function reorder(event: { oldIndex?: number; newIndex?: number }) {
  if (event.oldIndex == null || event.newIndex == null || event.oldIndex === event.newIndex) return
  emit('row-reorder', { rows: [...orderedRows.value], oldIndex: event.oldIndex, newIndex: event.newIndex, moved: orderedRows.value[event.newIndex], query: effectiveQuery.value })
}

const table = useVueTable<Record<string, unknown>>({
  get data() {
    return props.reorderable ? orderedRows.value : rows.value
  },
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
  manualPagination: !props.reorderable,
  getRowId: props.reorderable ? (record) => rowIdentity(record) : undefined,
  enableMultiSort: false,
  enableSortingRemoval: false,
  onSortingChange: (updater) => {
    const next = typeof updater === 'function' ? updater(sorting.value) : updater
    const sort = next[0]
    if (!sort) return
    updateQuery({ sort_by: sort.id, sort: sort.desc ? 'desc' : 'asc', page: 1 })
  },
  onPaginationChange: (updater) => {
    const next = typeof updater === 'function' ? updater(pagination.value) : updater
    if (next.pageIndex < 0) return
    if (totalPage.value != null && next.pageIndex >= totalPage.value) return
    updateQuery({ page: next.pageIndex + 1, limit: next.pageSize })
  },
})

// Let normal tables fill their container.  Column sizes remain a minimum, so
// resize state still controls overflow on narrow screens instead of shrinking
// every column into the left edge.
const tableMinimumWidth = computed(() =>
  visibleFields.value.reduce(
    (total, field) => total + sizeFor(field.key),
    slots['row-actions'] ? 64 : 0,
  ),
)

function setHeaderElement(key: string, element: unknown) {
  if (element instanceof HTMLElement) headerElements.set(key, element)
  else headerElements.delete(key)
}

function startResize(event: MouseEvent, columnKey: string) {
  if (event.button !== 0 || resizingColumn.value) return
  const header = headerElements.get(columnKey)
  resizeStartWidth.value = header?.getBoundingClientRect().width
    ?? columnSizing.value[columnKey]
    ?? table.getColumn(columnKey)?.getSize()
    ?? minimumColumnWidth.value
  resizeStartX.value = event.clientX
  resizingColumn.value = columnKey
  document.addEventListener('mousemove', resizeColumn)
  document.addEventListener('mouseup', stopResize)
}

function resizeColumn(event: MouseEvent) {
  const columnKey = resizingColumn.value
  if (!columnKey) return
  columnSizing.value[columnKey] = Math.max(
    minimumColumnWidth.value,
    resizeStartWidth.value + event.clientX - resizeStartX.value,
  )
}

function stopResize() {
  if (!resizingColumn.value) return
  resizingColumn.value = undefined
  resizeStartX.value = 0
  document.removeEventListener('mousemove', resizeColumn)
  document.removeEventListener('mouseup', stopResize)
  commitColumnSizing(columnSizing.value)
}

function cancelResize() {
  resizingColumn.value = undefined
  resizeStartX.value = 0
  document.removeEventListener('mousemove', resizeColumn)
  document.removeEventListener('mouseup', stopResize)
}

onBeforeUnmount(cancelResize)

function valueFor(record: Record<string, unknown>, field: ResolvedSurfaceField) {
  return field.read ? field.read(record, {}) : record[field.key]
}

function sizeFor(key: string) {
  return columnSizing.value[key] ?? table.getColumn(key)?.getSize() ?? minimumColumnWidth.value
}

function rendererFor(renderer: string | undefined) {
  return renderer ? renderers.require(renderer) : undefined
}

defineExpose({ refresh: loaded.refresh, query: query.values, updateQuery })
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
      <table class="w-full border-collapse table-auto" :style="{ minWidth: `${tableMinimumWidth}px` }">
        <colgroup>
          <col v-for="field in visibleFields" :key="field.key" :style="{ width: `${sizeFor(field.key)}px` }" />
          <col v-if="$slots['row-actions']" style="width: 64px" />
        </colgroup>
        <thead class="bg-surface-container-high text-on-surface-variant">
          <tr>
            <th
              v-for="field in visibleFields"
              :key="field.key"
              :ref="(element) => setHeaderElement(field.key, element)"
              scope="col"
              :style="{ textAlign: field.align }"
              class="relative whitespace-nowrap text-start border-b border-outline/[16%] px-4 py-2 text-xs font-semibold"
            >
              <button
                v-if="field.sortable && !props.reorderable"
                type="button"
                class="-mx-2 inline-flex rounded-md px-2 font-semibold transition-colors hover:bg-primary/[10%] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                @click="table.getColumn(field.key)?.toggleSorting()"
              >
                {{ field.label }}
              </button>
              <template v-else>{{ field.label }}</template>
              <button
                type="button"
                class="absolute inset-y-0 right-0 w-3 cursor-col-resize opacity-0 hover:opacity-100 focus-visible:opacity-100"
                aria-label="Resize column"
                role="separator"
                aria-orientation="vertical"
                :class="{ 'opacity-100': resizingColumn === field.key }"
                @mousedown.prevent="startResize($event, field.key)"
              />
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
        <Draggable
          v-if="props.reorderable"
          v-model="orderedRows"
          tag="tbody"
          :item-key="rowIdentity"
          class="divide-y divide-outline/[12%]"
          @end="reorder"
        >
          <template #item="{ element: record, index }">
            <tr class="transition-colors hover:bg-primary/[6%] focus-within:bg-primary/[6%]" @click="emit('row-click', record, index)">
              <td v-for="field in visibleFields" :key="field.key" :style="{ textAlign: field.align }" class="whitespace-nowrap px-4 py-3.5 text-on-surface">
                <slot :name="`cell:${field.key}`" :value="valueFor(record, field)" :record="record" :field="field" :index="index">
                  <component :is="rendererFor(field.renderer)" v-if="field.renderer" v-bind="field.props" :value="valueFor(record, field)" :record="record" :field="field" :index="index" />
                  <template v-else>{{ valueFor(record, field) ?? '-' }}</template>
                </slot>
              </td>
              <td v-if="$slots['row-actions']" class="w-px px-3 py-2 text-right" @click.stop><slot name="row-actions" :record="record" :index="index" /></td>
            </tr>
          </template>
        </Draggable>
        <tbody v-else class="divide-y divide-outline/[12%]">
          <tr
            v-for="(row, index) in table.getRowModel().rows"
            :key="row.id"
            class="transition-colors hover:bg-primary/[6%] focus-within:bg-primary/[6%]"
            @click="emit('row-click', row.original, index)"
          >
            <td
              v-for="field in visibleFields"
              :key="field.key"
              :style="{ textAlign: field.align }"
              class="whitespace-nowrap px-4 py-3.5 text-on-surface"
            >
              <slot
                :name="`cell:${field.key}`"
                :value="valueFor(row.original, field)"
                :record="row.original"
                :field="field"
                :index="index"
              >
                <component
                  :is="rendererFor(field.renderer)"
                  v-if="field.renderer"
                  v-bind="field.props"
                  :value="valueFor(row.original, field)"
                  :record="row.original"
                  :field="field"
                  :index="index"
                />
                <template v-else>{{ valueFor(row.original, field) ?? '-' }}</template>
              </slot>
            </td>
            <td v-if="$slots['row-actions']" class="w-px px-3 py-2 text-right" @click.stop>
              <slot name="row-actions" :record="row.original" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav v-if="showPagination" class="flex flex-wrap items-center justify-between gap-3 px-1 pt-1" aria-label="Pagination">
      <div class="flex items-center gap-1">
      <Button
        kind="icon"
        variant="standard"
        aria-label="Previous page"
        :disabled="!table.getCanPreviousPage()"
        @click="table.previousPage()"
      >
        <template #icon><Icon name="arrow-left-s" /></template>
      </Button>
      <span class="min-w-8 rounded-md text-center text-xs font-medium tabular-nums text-muted">
        {{ pagination.pageIndex + 1 }} / {{ totalPage }}
      </span>
      <Button
        kind="icon"
        variant="standard"
        aria-label="Next page"
        :disabled="!table.getCanNextPage()"
        @click="table.nextPage()"
      >
        <template #icon><Icon name="arrow-right-s" /></template>
      </Button>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <slot name="pagination-summary" :start="pageStart" :end="pageEnd" :total="meta?.total" :query="query.values">
          <span v-if="meta?.total != null" class="text-xs text-on-surface-variant">Showing data {{ pageStart }}–{{ pageEnd }} out of {{ meta.total }}</span>
        </slot>
        <slot name="page-size-control" :options="pageSizeOptions" :limit="pagination.pageSize" :set-page-size="setPageSize">
          <SelectInput
            :model-value="String(pagination.pageSize)"
            :data="pageSizeItems"
            :searchable="false"
            :clearable="false"
            @update:model-value="setPageSize"
          />
        </slot>
      </div>
    </nav>
  </div>
</template>
