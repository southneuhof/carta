<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import { defaultTableGetData, tableFieldTypes } from '@southneuhof/is-vue-framework/behaviors/table'
import { defaultTableConfig } from '@southneuhof/is-vue-framework/adapters/defaults'
import { parse } from '@southneuhof/is-vue-framework/utils/parse'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  data: { type: Object, required: true },
  level: { type: Number, required: true },
  fields: { type: Array as PropType<string[]>, required: true },
  fieldsAlias: { type: Object as PropType<Record<string, string>>, required: false, default: () => ({}) },
  fieldsType: { type: Object as PropType<Record<string, { type: string; props?: any }>>, default: () => ({}) },
  fieldsProxy: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsDictionary: { type: Object as PropType<Record<string, Record<string, string>>>, default: () => ({}) },
  fieldsUnit: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  fieldsParse: { type: Object as PropType<Record<string, string>>, default: () => ({}) },
  index: { type: Number, required: true },
  getAPI: { type: String, required: true },
  searchParameters: { type: Object as PropType<Record<string, any>>, required: false, default: () => ({}) },
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

const children = ref<any[]>([])
const expanded = ref(false)

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

const loadData = async () => {
  try {
    const { data } = await props.getData(props.getAPI, {
      level: props.level + 1,
      parent_id: props.data.id,
      ...props.searchParameters,
      ...props.searchParametersGenerator(props.level + 1, props.data.id),
    })
    children.value = formatTableData(data)
  } catch (error) {
    console.error('Error fetching items:', error)
  }
}

const toggle = async () => {
  if (!expanded.value) {
    await loadData()
  }
  expanded.value = !expanded.value
}
</script>

<template>
  <tr class="group relative hover:bg-on-surface/[4%]">
    <td>
      <div :style="{ paddingLeft: `${(!levels || level < levels ? props.level : props.level + 2) * 20}px` }" class="flex flex-row items-center gap-2">
        <Button v-if="!levels || level < levels" kind="icon" variant="standard" size="square" @click="toggle"><Icon :name="expanded ? 'arrow-up-s' : 'arrow-down-s'" /></Button>
        <slot v-if="$slots['list-rowActions'] && props.data" name="list-rowActions" v-bind="{ data: props.data, index: props.index }" />
        <p>{{ props.data[props.fields[0]] }}</p>
      </div>
    </td>
    <td v-for="field in props.fields.slice(1)" :key="field" class="px-2 py-4">
      <slot v-if="$slots[`list-${field}`]" :name="`list-${field}`" v-bind="{ data: props.data }" />
      <p v-else-if="props.data[field] === null">-</p>
      <component
        v-else-if="props.fieldsType[field]?.type && tableFieldTypes[props.fieldsType[field]?.type]"
        :is="tableFieldTypes[props.fieldsType[field]?.type]"
        :data="props.data[field]"
        v-bind="props.fieldsType[field]?.props"
        :index="props.index"
      />
      <template v-else>{{ props.data[field] }}</template>
    </td>
  </tr>
  <template v-if="expanded">
    <template v-if="children.length">
      <TreeItem
        v-for="(child, index) in children"
        :key="index"
        :index="index"
        :fields="props.fields"
        :data="child"
        :level="props.level + 1"
        :levels="levels"
        :searchParametersGenerator="searchParametersGenerator"
        :getAPI="props.getAPI"
        :searchParameters="props.searchParameters"
        :getData="props.getData"
      >
        <template v-for="slotname in Object.keys($slots)" v-slot:[String(slotname)]="data: any">
          <slot v-if="slotname.slice(0, 5) === 'list-'" :name="slotname" v-bind="(data as any)"></slot>
        </template>
      </TreeItem>
    </template>
    <div v-else :style="{ paddingLeft: `${(Number(props.level) + 2) * 20 + 2}px` }" class="p-2 text-muted">Tidak ada data</div>
  </template>
</template>
