<script setup lang="ts">
import type { PropType } from 'vue'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'

const modelValue = defineModel()

const props = defineProps({
  items: {
    type: Array as PropType<Array<{ id: string; label: string }>>,
    required: true,
  },
})
</script>

<template>
  <div class="flex flex-row items-center gap-2">
    <Chip
      v-for="(item, index) in props.items"
      class="cursor-pointer"
      @click="modelValue == item.id ? (modelValue = null) : (modelValue = item.id)"
      color="primary"
      :variant="modelValue == item.id ? 'tonal' : 'outline'"
    >
      {{ item.label }}
    </Chip>
  </div>
</template>
