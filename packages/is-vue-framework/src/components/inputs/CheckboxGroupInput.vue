<script setup lang="ts">
import { defaultSelectGetData } from '@southneuhof/is-vue-framework/runtimeDefaults'
import { onMounted, ref, type PropType } from 'vue'
import { commonProps } from './commonprops'
import BaseInput from './BaseInput.vue'
import Checkbox from './CheckboxInput.vue'
import { useFrameworkRuntime } from '@southneuhof/is-vue-framework'

const props = defineProps({
  pick: { type: String, default: 'id' },
  view: { type: String, default: 'name' },
  getAPI: {
    type: String,
    required: false,
    default: '',
  },
  searchParameters: {
    type: Object as PropType<Record<string, string>>,
    required: false,
    default: {},
  },
  getData: {
    type: Function as PropType<(getAPI: string, searchParameters: object) => Promise<Array<any>>>,
    required: false,
  },
  data: {
    type: Array as PropType<any[]>,
  },
  uniqueIDAs: {
    type: String,
  },
  ...commonProps,
})
const runtime = useFrameworkRuntime()
const getData = props.getData ?? ((getAPI: string, searchParameters: object) => defaultSelectGetData(getAPI, searchParameters, runtime.checkboxGroup, 'checkboxGroup'))

const modelValue = defineModel<any[]>({ default: () => [] })

const loading = ref(true)
const data = ref<any[]>()
const selected = ref<any>([])

onMounted(async () => {
  if (props.getAPI) data.value = await getData(props.getAPI, props.searchParameters)
  else data.value = props.data
  if (props.uniqueIDAs) {
    const parsed = modelValue.value.map((item) => ({ ...item, [props.pick]: item[props.uniqueIDAs!], [props.uniqueIDAs!]: undefined }))
    modelValue.value = parsed
    selected.value = parsed
  }
  loading.value = false
  // if (!modelValue.value) modelValue.value = data.value
})

function handleItemClick(item: any) {
  if ((modelValue.value as any[]).map((item) => item[props.pick]).includes(item[props.pick]))
    selected.value = (selected.value as any[]).filter((selectedItem: any) => selectedItem[props.pick] !== item[props.pick])
  else selected.value = [...(selected.value as any[]), item]

  modelValue.value = (selected.value as any[])?.map((item: any) => {
    const correspondingValue = (modelValue.value as any[])?.find((mv) => mv[props.pick] === item[props.pick])
    if (correspondingValue) return correspondingValue
    else {
      if (!props.uniqueIDAs) return item
      else return { ...item, [props.uniqueIDAs]: item[props.pick], [props.pick]: undefined }
    }
  })
}
</script>

<template>
  <BaseInput v-bind="props">
    <div v-if="!loading" class="grid gap-4 grid-dynamic-[250px]">
      <template v-for="item in data">
        <Checkbox :label="item[view]" :onToggle="() => handleItemClick(item)" :checked="!!modelValue.find((mvItem) => mvItem[pick] === item[pick])" />
      </template>
    </div>
  </BaseInput>
</template>
