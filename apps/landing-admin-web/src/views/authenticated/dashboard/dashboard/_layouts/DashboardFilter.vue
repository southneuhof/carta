<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue';
import MonthInput from '@southneuhof/is-vue-framework/components/inputs/MonthInput.vue';
  const modelValue = defineModel<any>({default: () => ({})})
</script>

<template>
  <Card class="flex flex-col gap-1">
    <div class="grid grid-cols-2 gap-4">
      <MonthInput v-model="modelValue.start_month" label="Dari"/>
      <MonthInput v-model="modelValue.end_month" label="Sampai"/>
    </div>
  </Card>
</template>
