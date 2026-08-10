<script setup lang="ts">
import { RouterLink } from 'vue-router'

const entries = [
  ['business-categories', 'Business Categories'],
  ['divisions', 'Divisions'],
  ['projects', 'Projects'],
  ['uoms', 'UOMs'],
  ['work-items', 'Work Items'],
  ['project-vendors', 'Project Vendors'],
  ['pts-work-categories', 'PTS Work Categories'],
  ['root-causes', 'Root Causes'],
  ['number-variables', 'Number Variables'],
  ['number-configs', 'Number Configurations'],
] as const
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">Master Data</h1>
    <div class="grid gap-2 sm:grid-cols-2">
      <RouterLink v-for="[key, label] in entries" :key="key" class="rounded border p-4" :to="`/master-data/${key}`">{{ label }}</RouterLink>
    </div>
  </section>
</template>
