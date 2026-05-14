<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import type { PropType } from 'vue'
import { parse } from '@southneuhof/is-vue-framework/utils/parse'
import Pagination from '@southneuhof/is-vue-framework/components/utils/Pagination.vue'
import { defaultTableGetData, tableFieldTypes } from '@southneuhof/is-vue-framework/behaviors/table'
import { defaultTableConfig } from '@southneuhof/is-vue-framework/adapters/defaults'
import { onMounted, onBeforeUnmount } from 'vue'
import Draggable from 'vuedraggable'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object as PropType<Record<string, string>>, required: false, default: () => ({}) },
  fieldsType: { type: Object as PropType<Record<string, { type: string; props?: any }>>, default: () => ({}) },
  fieldsProxy: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsDictionary: { type: Object as PropType<Record<string, Record<string, string>>>, default: () => ({}) },
  fieldsUnit: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsParse: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsClass: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsHeaderClass: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  data: { type: Array as PropType<any[]>, required: false },
  getAPI: { type: String, required: false },
  searchParameters: { type: Object as PropType<Record<string, any>>, required: false, default: () => ({}) },
  onDataLoaded: { type: Function as PropType<(data: any[]) => void>, required: false, default: () => ({}) },
  getData: {
    type: Function as PropType<(getAPI: string, searchParameters?: Record<string, number | string | undefined>) => Promise<{ data: Record<string, any>[]; totalPage: number; total: number }>>,
    required: false,
    default: defaultTableGetData,
  },
  paginated: { type: Boolean, required: false, default: false },
  sortable: { type: Boolean, required: false, default: false },
  limitSet: { type: Array as PropType<number[]>, default: [10, 20, 50, 100] },
  onRowClick: { type: Function, default: () => {} },
  hoverEffect: { type: Boolean, default: false },
  fieldsAlign: { type: Object as PropType<Record<string, 'start' | 'center' | 'end'>>, required: false },
  striped: { type: Boolean, default: false },
  draggable: { type: Boolean, default: false },
  onDragChange: { type: Function, default: () => {} },
  rowClass: { type: Function as PropType<(data: Record<string, any>, index: number) => string>, default: () => '' },
  tableId: { type: String, required: false, default: '' },
})
const slots = useSlots()

const modelValue = defineModel<Record<string, any>[]>({ default: () => [] })

const dataInfo = ref<Record<string, any>>({})
const tableData = ref<{ data: Record<string, any>[]; rawData: Record<string, any>[] }>({ data: [], rawData: [] })
const loading = ref(true)

const fieldSlots = defaultTableConfig.fieldSlots
const fieldsAlias = { ...defaultTableConfig.fieldsAlias, ...props.fieldsAlias }
const fieldsProxy = { ...defaultTableConfig.fieldsProxy, ...props.fieldsProxy }
const fieldsType = { ...defaultTableConfig.fieldsType, ...props.fieldsType }
const fieldsClass = { ...defaultTableConfig.fieldsClass, ...props.fieldsClass }
const fieldsHeaderClass = { ...defaultTableConfig.fieldsHeaderClass, ...props.fieldsHeaderClass }
const fieldsParse = { ...defaultTableConfig.fieldsParse, ...props.fieldsParse }
const fieldsAlign = { ...defaultTableConfig.fieldsAlign, ...props.fieldsAlign }

const localsearchParameters = ref<Record<string, any>>({ page: '1', limit: props.draggable ? 9999 : props.limitSet[0] })

watch(
  () => props.searchParameters,
  () =>
    (localsearchParameters.value = {
      page: localsearchParameters.value.page,
      limit: localsearchParameters.value.limit,
      ...props.searchParameters,
    }),
  { deep: true, immediate: true }
)

function formatTableData(data: Record<string, any>[]) {
  const res: any[] = []
  data.forEach((row, index) => {
    // keep a reference to the original raw row for ordering sync
    res.push({ rawData: row })
    Object.keys(row).forEach((field) => {
      let view = row[fieldsProxy[field] || field] ?? '-'
      if (props.fieldsDictionary[field]) view = props.fieldsDictionary[field][row[field]] ?? '-'
      else if (fieldsParse[field]) view = parse(fieldsParse[field], row[field])
      if (props.fieldsUnit[field]) view = `${view} ${props.fieldsUnit[field]}`
      res[index][field] = view
    })
  })
  return res
}

function handleFieldFilter(field: string) {
  if (localsearchParameters.value.sort_by === field) {
    if (localsearchParameters.value.sort === 'asc') localsearchParameters.value.sort = 'desc'
    else localsearchParameters.value.sort = 'asc'
  } else {
    localsearchParameters.value.sort_by = field
    localsearchParameters.value.sort = 'desc'
  }
}

async function loadData() {
  loading.value = true
  if (props.getAPI) {
    const { data, total, totalPage } = await props.getData(props.getAPI!, localsearchParameters.value)
    tableData.value = { ...data, data: formatTableData(data), rawData: data }
    dataInfo.value = { total, totalPage, length: data?.length || data.length }
  } else if (props.data) tableData.value = { ...props.data, data: formatTableData(props.data), rawData: props.data }
  // keep modelValue synced with the latest rawData
  modelValue.value = tableData.value.rawData
  props.onDataLoaded(tableData.value.rawData)
  loading.value = false
}

await loadData()

if (props.data) {
  watch(
    () => props.data,
    () => {
      loadData()
    },
    { deep: true }
  )
}

watch(
  localsearchParameters,
  () => {
    loadData()
  },
  { deep: true }
)

const rowExpandActiveIndex = ref()

// When modelValue changes from the parent, update tableData and reformat
watch(
  modelValue,
  (val) => {
    if (!val) return
    tableData.value = {
      ...tableData.value,
      rawData: val as any[],
      data: formatTableData(val as any[]),
    }
  },
  { deep: true }
)

// Apply order changes from formatted data to rawData and v-model
function onDragChange(event: any) {
  // Rebuild rawData order following the formatted list
  const newRaw = (tableData.value.data || []).map((it: any, i: number) => it?.rawData ?? tableData.value.rawData[i])
  tableData.value = {
    ...tableData.value,
    rawData: newRaw,
  }
  modelValue.value = newRaw
  props.onDragChange(event)
}

const fieldsAlignClassMap = {
  start: {
    text: 'text-start',
    flex: 'flex items-center justify-center',
  },
  center: {
    text: 'text-center',
    flex: 'flex items-center justify-center',
  },
  end: {
    text: 'text-end',
    flex: 'flex items-center justify-center',
  },
}

// Column resizing state
const columnWidths = ref<Record<string, number>>({})
const columnRefs = ref<Record<string, HTMLElement | null>>({})
const resizingField = ref<string | null>(null)
const initialWidths = ref<Record<string, number>>({})
const initialMouseX = ref<number>(0)
const COLUMN_WIDTHS_STORAGE_KEY = 'tableColumnWidths'

const tableStorageId = computed(() => {
  if (props.tableId) return props.tableId
  if (props.getAPI) return props.getAPI
  return `fields:${props.fields.join('|')}`
})

function loadColumnWidths() {
  const saved = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY)
  if (!saved) return
  try {
    const parsed = JSON.parse(saved) as Record<string, Record<string, number>>
    const tableWidths = parsed?.[tableStorageId.value]
    if (!tableWidths || typeof tableWidths !== 'object') return
    Object.assign(columnWidths.value, tableWidths)
  } catch (_) {}
}

function saveColumnWidths() {
  const saved = localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY)
  let parsed: Record<string, Record<string, number>> = {}
  if (saved) {
    try {
      parsed = JSON.parse(saved)
    } catch (_) {}
  }
  parsed[tableStorageId.value] = { ...columnWidths.value }
  localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(parsed))
}

watch(
  columnWidths,
  () => {
    saveColumnWidths()
  },
  { deep: true }
)

function startResize(e: MouseEvent, field: string) {
  resizingField.value = field
  const th = columnRefs.value[field]
  if (th) {
    initialWidths.value[field] = th.getBoundingClientRect().width
  }
  initialMouseX.value = e.clientX
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', stopResize)
}

function onMouseMove(e: MouseEvent) {
  if (!resizingField.value) return

  const th = columnRefs.value[resizingField.value]
  if (!th) return

  const initialWidth = initialWidths.value[resizingField.value] || th.getBoundingClientRect().width
  const deltaX = e.clientX - initialMouseX.value
  const newWidth = Math.max(60, initialWidth + deltaX)
  columnWidths.value[resizingField.value] = newWidth
}

function stopResize() {
  if (resizingField.value) saveColumnWidths()
  resizingField.value = null
  initialMouseX.value = 0
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  loadColumnWidths()
  window.addEventListener('beforeunload', saveColumnWidths)
})

onBeforeUnmount(() => {
  stopResize()
  saveColumnWidths()
  window.removeEventListener('beforeunload', saveColumnWidths)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="relative block w-full overflow-x-auto rounded-xl">
      <template v-if="tableData.data.length && !loading">
        <slot v-if="$slots['list-data']" name="list-data" v-bind="{ data: tableData.rawData, props }" />
        <table v-else class="w-full table-auto">
          <slot v-if="$slots['list-thead']" name="list-thead" v-bind="{ data: tableData.rawData, props }"></slot>
          <thead v-else>
            <tr>
              <th
                v-if="$slots['list-rowActions']"
                class="sticky-left-head w-[1%] whitespace-nowrap bg-surface-container-high px-2 py-2 text-left text-on-surface dark:bg-surface-container-high dark:text-on-surface"
                :class="``"
              ></th>
              <th
                v-for="field in fields"
                :key="field"
                :ref="(el => columnRefs[field] = el as HTMLElement)"
                :style="{ width: columnWidths[field] + 'px' }"
                class="relative whitespace-nowrap bg-surface-container-high px-2 py-2 text-left text-on-surface dark:bg-surface-container-high dark:text-on-surface"
                :class="`${fieldsHeaderClass[field]}`"
              >
                <button
                  v-if="sortable"
                  class="flex h-auto w-full flex-row items-center gap-2"
                  :class="`${fieldsAlignClassMap[fieldsAlign[field] ?? 'start'].text}`"
                  @click="handleFieldFilter(field)"
                  kind="icon" variant="standard"
                >
                  <div class="font-semibold print:text-black">{{ fieldsAlias[field] ?? field }}</div>
                  <Icon v-if="localsearchParameters.sort_by === field" size="sm" :name="localsearchParameters.sort === 'asc' ? 'arrow-up' : 'arrow-down'" />
                </button>
                <div v-else class="font-semibold print:text-black">{{ fieldsAlias[field] ?? field }}</div>
                <!-- Resizer handle -->
                <div class="absolute right-0 top-0 z-50 flex h-full w-2 cursor-col-resize items-center justify-center" @mousedown.prevent="startResize($event, field)">
                  <div
                    class="pointer-events-none h-full w-px transition-colors duration-150 bg-outline/[24%]"
                    :class="resizingField === field ? 'bg-on-primary dark:bg-on-surface' : ''"
                  ></div>
                </div>
              </th>
            </tr>
          </thead>
          <slot v-if="$slots['list-tbody']" name="list-tbody" v-bind="{ data: tableData.rawData, props }"></slot>
          <template v-else>
            <tr v-if="$slots['list-prefix-row']">
              <slot name="list-prefix-row"></slot>
            </tr>
            <!-- <template v-for="(item, index) in tableData.data">
              <tr class="group relative" :class="{'hover:bg-primary/[8%]': hoverEffect, 'bg-surface-container-highest/[12%]': props.striped && index % 2 === 1}" @click="() => onRowClick(item)">
                <td v-if="$slots['list-rowActions'] && tableData.rawData[index]" class="p-3">
                  <div class="flex flex-row items-center gap-4">
                    <Button v-if="$slots['list-rowExpand']" kind="icon" variant="standard" size="square" @click="() => rowExpandActiveIndex === index ? rowExpandActiveIndex = null : rowExpandActiveIndex = index"><Icon :name="rowExpandActiveIndex == index ? 'arrow-down-s' : 'arrow-up-s'"/></Button>
                    <slot name="list-rowActions" v-bind="{data: tableData.rawData[index], index}"/>
                  </div>
                </td>
                <td v-for="field in fields" class="p-2" :class="fieldsAlignClassMap[fieldsAlign[field] ?? 'start'].text">
                  <component v-if="fieldSlots[field]" :is="fieldSlots[field]" :data="{data: tableData.rawData[index]}"/>
                  <slot v-else-if="$slots[`list-${field}`]" :name="`list-${field}`" v-bind="{data: tableData.rawData[index], index}"/>
                  <p v-else-if="tableData?.rawData[index][field] == null">-</p>
                  <component v-else-if="(fieldsType[field]?.type && tableFieldTypes[fieldsType[field]?.type])" :is="tableFieldTypes[fieldsType[field]?.type]" :data="tableData?.rawData[index][field]" v-bind="fieldsType[field]?.props" :index="index"/>
                  <p v-else :class="fieldsClass[field]">{{ tableData?.data[index][field] }}</p>
                </td>
              </tr>
              <slot v-if="$slots['list-rowExpand'] && rowExpandActiveIndex === index" name="list-rowExpand" v-bind="{data: tableData.rawData[index]}"/>
            </template> -->
            <Draggable v-model="tableData.data" item-key="id" tag="tbody" @change="onDragChange" :disabled="!draggable">
              <template #item="{ element: item, index }">
                <tr
                  class="group relative"
                  :class="[
                    { 'overlay after:pointer-events-none after:bg-primary/[8%]': hoverEffect, 'bg-surface-container-highest/[12%]': props.striped && index % 2 === 1 },
                    props.rowClass(tableData.rawData[index]!, index),
                  ]"
                  @click="() => onRowClick(item)"
                >
                  <td v-if="$slots['list-rowActions'] && tableData.rawData[index]" class="p-3">
                    <div class="flex flex-row items-center gap-4">
                      <Button
                        v-if="$slots['list-rowExpand']"
                        kind="icon" variant="standard"
                        size="square"
                        @click="() => (rowExpandActiveIndex === index ? (rowExpandActiveIndex = null) : (rowExpandActiveIndex = index))"
                        ><Icon :name="rowExpandActiveIndex == index ? 'arrow-down-s' : 'arrow-up-s'"
                      /></Button>
                      <slot name="list-rowActions" v-bind="{ data: tableData.rawData[index], index }" />
                    </div>
                  </td>
                  <td v-for="field in fields" class="p-2" :class="fieldsAlignClassMap[fieldsAlign[field] ?? 'start'].text">
                    <component v-if="fieldSlots[field]" :is="fieldSlots[field]" :data="{ data: item }" />
                    <slot v-else-if="$slots[`list-${field}`]" :name="`list-${field}`" v-bind="{ data: item.rawData, index }" />
                    <p v-else-if="tableData?.rawData[index]?.[field] == null">-</p>
                    <component
                      v-else-if="fieldsType[field]?.type && tableFieldTypes[fieldsType[field]?.type]"
                      :is="tableFieldTypes[fieldsType[field]?.type]"
                      :data="item[field]"
                      :rawData="item.rawData"
                      :field="field"
                      v-bind="fieldsType[field]?.props"
                      :index="index"
                    />
                    <p v-else :class="fieldsClass[field]">{{ item[field] ?? '-' }}</p>
                  </td>
                </tr>
              </template>
            </Draggable>
            <tr v-if="$slots['list-suffix-row']">
              <slot name="list-suffix-row" v-bind="{ data: tableData.rawData }"></slot>
            </tr>
          </template>
        </table>
      </template>
      <div v-else-if="loading" class="flex flex-col">
        <Card class="h-[49px] animate-pulse" color="surfaceContainerHigh"></Card>
        <div v-for="_ in Array(tableData?.data.length || 10)" class="py-4">
          <Card class="h-full animate-pulse" color="surfaceContainerHigh"></Card>
        </div>
      </div>
      <div v-else class="mt-2 flex items-center justify-center text-muted print:items-start print:justify-start">Tidak ada data</div>
    </div>
    <Pagination v-if="props.paginated && !props.draggable" :limitSet="limitSet" v-model="localsearchParameters" :dataInfo="(dataInfo as any)">
      <template v-if="$slots['pagination-lengthControl']" #pagination-lengthControl>
        <slot name="pagination-lengthControl"></slot>
      </template>
    </Pagination>
  </div>
</template>

<style scoped>
th {
  min-width: 20px;
}

th .resizer {
  position: absolute;
  right: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 50;
}
</style>
