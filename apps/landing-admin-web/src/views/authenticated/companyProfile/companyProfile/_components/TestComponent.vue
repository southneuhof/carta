<script setup lang="ts">
const props = defineProps({
  optionalMessage: {
    type: String,
    default: 'optional message is not provided'
  },
  mandatoryMessage: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <p>optional: {{ optionalMessage }}</p>
    <p>mandatory: {{ mandatoryMessage }}</p>
  </div>
</template>