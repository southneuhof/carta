<script setup lang="ts">
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import services from '@/utils/services';
import { inject } from 'vue';

const filter = inject<any>('filter', {})
const {data} = await services.get('dashboard', {event_type: 'aggregate_form_submission', start_month: filter.value.start_month, end_month: filter.value.end_month})
</script>

<template>
  <Card class="gap-2 flex items-center justify-center">
    <p class="text-2xl font-bold">{{ data[0].value }}</p>
    <p class="text-muted">Formulir terisi</p>
  </Card>
</template>