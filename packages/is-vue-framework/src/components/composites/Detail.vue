<script setup lang="ts">
import { defaultDetailGetData, defaultDetailOnDataLoaded, getDetailFieldTypes } from '@southneuhof/is-vue-framework/runtimeDefaults'
import { parse } from '@southneuhof/utilities/parse'
import { computed, onMounted, ref, type PropType } from 'vue'
import { componentTypeMap, parsedTypes } from './common/properties'
import { defaultDetailConfig } from '@southneuhof/is-vue-framework/adapters/defaults'
import type { CRUDDetailOperation } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { useFrameworkRuntime } from '@southneuhof/is-vue-framework'

const props = defineProps({
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsType: { type: Object as PropType<Record<string, { type: string; props?: any }>>, default: () => ({}) },
  fieldsProxy: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsDictionary: { type: Object as PropType<Record<string, Record<string, string>>>, default: () => ({}) },
  fieldsUnit: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsParse: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  data: { type: Object as PropType<Record<string, any>> },
  getAPI: { type: String },
  operation: { type: Function as PropType<CRUDDetailOperation> },
  dataID: { type: String },
  searchParameters: { type: Object as PropType<Record<string, any>> },
  getData: { type: Function as PropType<(getAPI: string, searchParameters?: Record<string, any>, dataID?: string) => Promise<Record<string, any>>> },
  onDataLoaded: { type: Function as PropType<(data: any) => void> },
  rowGap: { type: String, default: '4px' },
})
const runtime = useFrameworkRuntime()
const resolvedGetData = props.getData ?? ((getAPI: string, searchParameters?: Record<string, any>, dataID?: string) => defaultDetailGetData(getAPI, searchParameters, dataID, runtime.detail))
const onDataLoaded = props.onDataLoaded ?? ((data: any) => defaultDetailOnDataLoaded(data, runtime.detail))

const fieldSlots = defaultDetailConfig.fieldSlots
const fieldsAlias = { ...defaultDetailConfig.fieldsAlias, ...props.fieldsAlias }
const fieldsProxy = { ...defaultDetailConfig.fieldsProxy, ...props.fieldsProxy }
const fieldsType = { ...defaultDetailConfig.fieldsType, ...props.fieldsType }
const fieldsParse = { ...defaultDetailConfig.fieldsParse, ...props.fieldsParse }
const detailFieldTypes = computed(() => getDetailFieldTypes(runtime.detail))

// const fields = computed(() => props.fields.filter(field => field.slice(0, 2) !== 'S|'))
const detailData = ref<{ data: Record<string, any>; rawData: Record<string, any> }>({ data: {}, rawData: {} })
const loading = ref(true)

function formatDetailData(data: Record<string, any>) {
  const res: Record<string, string> = {}
  Object.keys(data).forEach((field) => {
    let view = data[fieldsProxy[field] || field] ?? '-'
    if (props.fieldsDictionary[field]) view = props.fieldsDictionary[field][data[field]] ?? '-'
    else if (fieldsParse[field]) view = parse(fieldsParse[field], data[field])
    if (props.fieldsUnit[field]) view = `${view}${props.fieldsUnit[field]}`
    res[field] = view
  })
  return res
}

async function getData() {
  if (!props.data && (props.operation || props.getAPI)) {
    const request = props.operation
      ? props.operation(props.dataID || '', props.searchParameters)
      : resolvedGetData(props.getAPI!, props.searchParameters, props.dataID)
    await request.then((data) => {
      if (!data) return
      detailData.value = { data: formatDetailData(data), rawData: data }
      onDataLoaded(data)
      loading.value = false
    })
  } else if (props.data) {
    detailData.value = { data: formatDetailData(props.data), rawData: props.data }
      onDataLoaded(props.data)
    loading.value = false
  }
}

await getData()

// onMounted(() => {
//   getData()
// })
</script>

<template>
  <template v-if="!loading">
    <slot v-if="$slots['detail-data']" name="detail-data" v-bind="{ data: detailData?.rawData }" />
    <table v-else>
      <tbody>
        <template v-for="(field, index) in fields">
          <tr v-if="field.slice(0, 2) === 'S|'">
            <td colspan="3" class="py-2 print:py-1 print:pb-2">
              <div class="print:bg-[#eeeeee] print:p-2 print:text-[#000000]">
                <p class="text-sm font-bold uppercase print:text-base print:normal-case">{{ field.slice(2) }}</p>
              </div>
            </td>
          </tr>
          <tr v-else>
            <td :style="{ paddingTop: rowGap, paddingBottom: rowGap }" className="w-[1%] whitespace-nowrap align-top">{{ fieldsAlias[field] ?? field }}</td>
            <td :style="{ paddingTop: rowGap, paddingBottom: rowGap }" className="px-4 w-[1%] whitespace-nowrap align-top">:</td>
            <td :style="{ paddingTop: rowGap, paddingBottom: rowGap }" className="px-2 align-top">
              <component v-if="fieldSlots[field]" :is="fieldSlots[field]" :data="detailData.rawData" />
              <slot v-else-if="$slots[`detail-${field}`]" :name="`detail-${field}`" v-bind="{ data: detailData?.rawData, index }"></slot>
              <template v-else-if="detailData?.rawData[field] == null">-</template>
              <component
                v-else-if="fieldsType[field]?.type && detailFieldTypes[fieldsType[field]?.type]"
                :is="detailFieldTypes[fieldsType[field]?.type]"
                :data="detailData?.rawData[field]"
                v-bind="fieldsType[field]?.props"
                :index="index"
              />
              <template v-else>{{ detailData?.data[field] }}</template>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </template>
</template>
