<script setup lang="ts">
const model = defineModel<string | number | null>()

const props = defineProps({
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <input
    v-model="model"
    type="text"
    class="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm"
    :placeholder="props.placeholder || 'Masukkan klausul ISO'"
    :disabled="props.disabled"
  />
</template>
