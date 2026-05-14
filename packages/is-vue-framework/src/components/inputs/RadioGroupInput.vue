<script setup lang="ts">
import { ref, watch, onBeforeMount } from 'vue'
import type { PropType } from 'vue'
import Radio from '@southneuhof/is-vue-framework/components/inputs/Radio.vue'
import { commonProps } from './commonprops'
import { defaultGetData } from '@southneuhof/is-vue-framework/behaviors/radioGroup'
import BaseInput from './BaseInput.vue'

const props = defineProps({
  data: {
    type: Array as PropType<Array<Record<string, any>>>,
    default: () => [],
  },
  view: {
    type: String,
    default: 'name',
  },
  pick: {
    type: String,
    default: 'id',
  },
  getAPI: {
    type: String,
    default: '',
  },
  getData: {
    type: Function as PropType<(getAPI: string, searchParameters?: object) => Promise<Array<any>>>,
    default: defaultGetData,
  },
  variant: {
    type: String as PropType<'native' | 'card'>,
    default: 'native',
  },
  direction: {
    type: String as PropType<'row' | 'column'>,
    default: 'row',
  },
  defaultValue: {},
  searchParameters: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  ...commonProps,
})

const modelValue = defineModel()
const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()
const loading = ref(false)
const data = ref()

async function preflight() {
  loading.value = true
  if (props.getAPI) data.value = await props.getData(props.getAPI, props.searchParameters)
  else if (props.data) data.value = props.data
  if (props.defaultValue && modelValue.value == null) modelValue.value = props.defaultValue
  loading.value = false
}

const directionClass = {
  row: 'flex flex-row gap-x-8 gap-y-4',
  column: 'flex flex-col gap-1',
}

preflight()

watch(modelValue, () => {
  emit('validation:touch')
})
</script>

<template>
  <BaseInput v-if="!loading" v-bind="props">
    <div v-if="data?.length" :class="`${directionClass[direction]} ${$attrs.class as string} flex-wrap`">
      <Radio v-for="item in data" @click="modelValue = item[pick]" :description="item[view]" :checked="modelValue === item[pick]">
        <template v-if="$slots['label']" #label>
          <slot name="label" v-bind="{ data: item }" />
        </template>
      </Radio>
    </div>
    <p v-else class="text-muted">Tidak ada data</p>
  </BaseInput>
</template>
