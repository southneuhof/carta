<script setup lang="ts">
import { getDetailFieldTypes } from '@southneuhof/is-vue-framework/runtimeDefaults'
import { parse } from '@southneuhof/utilities/parse'
import { computed, ref, watch, type PropType } from 'vue'
import { componentTypeMap, parsedTypes } from './common/properties'
import { useFrameworkDefaults, useFrameworkRuntime } from '@southneuhof/is-vue-framework'
import type { DetailLoad } from './types'

const props = defineProps({
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsType: { type: Object as PropType<Record<string, { type: string; props?: any }>>, default: () => ({}) },
  fieldsProxy: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsDictionary: { type: Object as PropType<Record<string, Record<string, string>>>, default: () => ({}) },
  fieldsUnit: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsParse: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  data: { type: Object as PropType<Record<string, any>> },
  load: { type: Function as PropType<DetailLoad> },
  rowGap: { type: String, default: '4px' },
})
const runtime = useFrameworkRuntime()
const defaultDetailConfig = useFrameworkDefaults().detail
const emit = defineEmits<{ (event: 'loaded', data: any): void; (event: 'error', error: unknown): void }>()

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

async function reload() {
  loading.value = true
  try {
    const data = props.load ? await props.load() : props.data
    detailData.value = { data: data ? formatDetailData(data) : {}, rawData: data || {} }
    if (data) emit('loaded', data)
  } catch (error) {
    detailData.value = { data: {}, rawData: {} }
    emit('error', error)
  } finally {
    loading.value = false
  }
}

if (props.load && props.data && (import.meta as any).env?.DEV) console.warn('[vue-framework] Detail received both load and data; load takes precedence.')

await reload()
defineExpose({ reload })

watch(
  () => props.data,
  () => {
    if (!props.load) reload()
  },
  { deep: true },
)

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
              <slot v-else-if="$slots[`view-${field}`]" :name="`view-${field}`" v-bind="{ data: detailData?.rawData, index }"></slot>
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
