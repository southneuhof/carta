<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import JobDetailUnder from './_layouts/JobDetailUnder.vue'
import jobModel from '@client/data-model/models/job.model'
import { parse } from '@southneuhof/utilities/parse'
</script>

<template>
  <CRUDComposite :config="jobModel">
    <template #detail-under="{ data }">
      <JobDetailUnder :data="data" />
    </template>
    <template #list-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #detail-name="{ data }">
      <p>{{ data.translations.find((item: any) => item.language === 'id')?.name }}</p>
    </template>
    <template #list-created_at="{ data }">
      <p class="whitespace-nowrap">{{ parse('date', data.created_at) }}</p>
    </template>
  </CRUDComposite>
</template>
