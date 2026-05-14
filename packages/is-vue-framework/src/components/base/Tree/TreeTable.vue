<script setup lang="ts">
import { ref, onMounted, type PropType } from 'vue'
import TreeItem from './TreeItem.vue'
import { defaultTableConfig } from '@southneuhof/is-vue-framework/adapters/defaults'
import { defaultTableGetData } from '@southneuhof/is-vue-framework/behaviors/table'
import { parse } from '@southneuhof/is-vue-framework/utils/parse'

const props = defineProps({
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object as PropType<Record<string, string>>, required: false, default: () => ({}) },
  fieldsType: { type: Object as PropType<Record<string, { type: string; props?: any }>>, default: () => ({}) },
  fieldsProxy: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsDictionary: { type: Object as PropType<Record<string, Record<string, string>>>, default: () => ({}) },
  fieldsUnit: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsParse: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  getAPI: { type: String, required: true },
  searchParameters: { type: Object as PropType<Record<string, any>>, required: false, default: () => ({}) },
  onDataLoaded: { type: Function as PropType<(data: any[]) => void>, required: false, default: () => ({}) },
  getData: {
    type: Function as PropType<(getAPI: string, searchParameters?: Record<string, number | string | undefined>) => Promise<{ data: Record<string, any>[]; totalPage: number; total: number }>>,
    required: false,
    default: defaultTableGetData,
  },
  levels: { type: Number },
  searchParametersGenerator: { type: Function, default: () => ({}) },
})

const fieldsAlias = { ...defaultTableConfig.fieldsAlias, ...props.fieldsAlias }
const fieldsProxy = { ...defaultTableConfig.fieldsProxy, ...props.fieldsProxy }

function formatTableData(data: Record<string, any>[]) {
  const res: any[] = []
  data.forEach((row, index) => {
    res.push({})
    Object.keys(row).forEach((field) => {
      let view = row[fieldsProxy[field] || field] ?? '-'
      if (props.fieldsDictionary[field]) view = props.fieldsDictionary[field][row[field]] ?? '-'
      else if (props.fieldsParse[field]) view = parse(props.fieldsParse[field], row[field])
      if (props.fieldsUnit[field]) view = `${view} ${props.fieldsUnit[field]}`
      res[index][field] = view
    })
  })
  return res
}

const rootItems = ref<any[]>([])

onMounted(async () => {
  if (props.getAPI) {
    const { data } = await props.getData(props.getAPI, { level: 1, ...props.searchParameters, ...props.searchParametersGenerator(1, null) })
    rootItems.value = formatTableData(data)
    props.onDataLoaded(data)
  }
})
</script>

<template>
  <table>
    <thead>
      <tr>
        <th class="whitespace-nowrap p-2 text-start font-semibold text-muted" v-for="field in fields" :key="field">{{ fieldsAlias[field] ?? field }}</th>
      </tr>
    </thead>
    <tbody>
      <TreeItem
        v-if="rootItems?.length"
        v-for="(item, index) in rootItems"
        :index="index"
        :key="index"
        :fields="fields"
        :data="item"
        :level="1"
        :levels="levels"
        :fieldsType="fieldsType"
        :getAPI="props.getAPI"
        :searchParameters="props.searchParameters"
        :getData="props.getData"
        :searchParametersGenerator="searchParametersGenerator"
        :fieldsProxy="fieldsProxy"
      >
        <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data">
          <slot v-if="slotname.slice(0, 5) === 'list-'" :name="slotname" v-bind="(data as any)"></slot>
        </template>
      </TreeItem>
      <div v-else class="p-2 text-muted">Tidak ada data</div>
    </tbody>
  </table>
</template>
