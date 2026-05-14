<script setup lang="ts">
import { type PropType } from 'vue'

defineSlots<{
  [key: string]: unknown
}>()

const props = defineProps({
  data: {
    type: Array as PropType<Record<string, any>[]>,
    required: true,
  },
  childKey: {
    type: String,
    default: 'CHILDREN',
  },
})
</script>

<template>
  <template v-for="(data, index) in props.data" :key="data.id">
    <slot name="item" v-bind="{ data, index }"></slot>
    <Tree v-if="data[childKey] && data[childKey].length" :data="data[childKey]" :childKey="childKey">
      <template #item="{ data, index }">
        <slot name="item" v-bind="{ data, index }"></slot>
      </template>
    </Tree>
  </template>
</template>
