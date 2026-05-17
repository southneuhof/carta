<script setup lang="ts">
const modelValue = defineModel<string | undefined>()

defineProps<{
  disabled?: boolean
  placeholder?: string
  required?: boolean
}>()
</script>

<template>
  <input v-model="modelValue" :disabled="disabled" :required="required" :placeholder="placeholder" class="w-full rounded-lg border border-outline bg-surface px-3 py-2" />
</template>
