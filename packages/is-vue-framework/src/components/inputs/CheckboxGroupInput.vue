<script setup lang="ts">
import { onMounted, ref, type PropType } from 'vue'
import type { OptionLoad, QueryNamespace } from '../../contracts'
import { commonProps } from './commonprops'
import BaseInput from './BaseInput.vue'
import Checkbox from './CheckboxInput.vue'
import { useOptionSource } from './useOptionSource'

const props = defineProps({
  pick: { type: String, default: 'id' },
  view: { type: String, default: 'name' },
  searchParameters: {
    type: Object as PropType<Record<string, unknown>>,
    required: false,
    default: () => ({}),
  },
  data: {
    type: Array as PropType<readonly Record<string, any>[]>,
  },
  load: Function as PropType<OptionLoad<Record<string, any>>>,
  namespace: String as PropType<QueryNamespace>,
  uniqueIDAs: {
    type: String,
  },
  ...commonProps,
})
const modelValue = defineModel<any[]>({ default: () => [] })

const { options: data, loading, error, refresh } = useOptionSource(props)
const selected = ref<any>([])

onMounted(() => {
  if (props.uniqueIDAs) {
    const parsed = modelValue.value.map((item) => ({ ...item, [props.pick]: item[props.uniqueIDAs!], [props.uniqueIDAs!]: undefined }))
    modelValue.value = parsed
    selected.value = parsed
  }
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
    <p v-if="loading" class="text-muted">Memuat data...</p>
    <p v-else-if="error" class="text-error">{{ error.message }} <button type="button" @click="refresh">Coba lagi</button></p>
    <div v-else class="grid gap-4 grid-dynamic-[250px]">
      <template v-for="item in data">
        <Checkbox :label="item[view]" :onToggle="() => handleItemClick(item)" :checked="!!modelValue.find((mvItem) => mvItem[pick] === item[pick])" />
      </template>
    </div>
  </BaseInput>
</template>
