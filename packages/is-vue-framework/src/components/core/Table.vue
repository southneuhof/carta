<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>, TQuery extends object = Record<string, unknown>">
import { computed, ref, watch } from 'vue'
import type { CollectionProps, QueryValues, RowReorderPayload, TableProps } from '../../contracts'
import Collection from './Collection.vue'
import TableContent from './TableContent.vue'

const props = withDefaults(defineProps<TableProps<TRecord, TQuery>>(), {
  searchParameters: () => ({}),
  pagination: 'auto',
  pageSizeOptions: () => [10, 25, 50, 100],
  defaultPageSize: 10,
  minColumnWidth: 96,
})

const emit = defineEmits<{
  (event: 'update:query', query: QueryValues): void
  (event: 'update:visibleColumns', columns: string[]): void
  (event: 'update:columnSizing', sizes: Record<string, number>): void
  (event: 'row-click', record: Record<string, unknown>, index: number): void
  (event: 'row-reorder', payload: RowReorderPayload): void
}>()

const collectionRef = ref<{ refresh: () => Promise<void> }>()
const exposedQuery = ref<QueryValues>({ page: 1, limit: props.defaultPageSize })
watch(() => props.query, (value) => {
  if (value) exposedQuery.value = { ...value } as QueryValues
}, { immediate: true })

const collectionProps = computed<CollectionProps<TRecord, TQuery>>(() => {
  const value: CollectionProps<TRecord, TQuery> = {
    data: props.data,
    load: props.load,
    searchParameters: props.searchParameters,
    namespace: props.namespace,
    pagination: props.pagination,
    pageSizeOptions: props.pageSizeOptions,
    defaultPageSize: props.defaultPageSize,
    reorderable: props.reorderable,
  }
  if (props.query !== undefined) value.query = props.query
  return value
})

function updateQuery(query: QueryValues) {
  exposedQuery.value = query
  emit('update:query', query)
}

function updateCollectionQuery(query: QueryValues) {
  exposedQuery.value = query
  emit('update:query', query)
}

function refresh() {
  return collectionRef.value?.refresh() ?? Promise.resolve()
}

function rowClick(record: Record<string, unknown>, index: number) {
  emit('row-click', record, index)
}

function rowReorder(payload: RowReorderPayload) {
  emit('row-reorder', payload)
}

defineExpose({ refresh, query: exposedQuery, updateQuery })
</script>

<template>
  <Collection ref="collectionRef" v-bind="collectionProps" @update:query="updateCollectionQuery">
    <template #default="collection">
      <TableContent
        :fields="props.fields"
        :records="collection.records"
        :meta="collection.meta"
        :loading="collection.loading"
        :error="collection.error"
        :empty="collection.empty"
        :query="collection.query"
        :search-parameters="props.searchParameters"
        :namespace="props.namespace"
        :pagination="props.pagination"
        :page-size-options="props.pageSizeOptions"
        :default-page-size="props.defaultPageSize"
        :min-column-width="props.minColumnWidth"
        :visible-columns="props.visibleColumns"
        :column-sizing="props.columnSizing"
        :reorderable="props.reorderable"
        :row-key="props.rowKey"
        :schema="props.schema"
        @update:query="collection.updateQuery"
        @update:visible-columns="emit('update:visibleColumns', $event)"
        @update:column-sizing="emit('update:columnSizing', $event)"
        @row-click="rowClick"
        @row-reorder="rowReorder"
      >
        <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </TableContent>
    </template>
  </Collection>
</template>
