<script setup lang="ts">
import { RouterLink } from 'vue-router'

const entries = [
  ['business-categories', 'Kategori Bisnis'],
  ['divisions', 'Divisi'],
  ['projects', 'Proyek'],
  ['uoms', 'Satuan'],
  ['work-items', 'Jenis Pekerjaan'],
  ['pts-work-categories', 'Kategori Pekerjaan'],
  ['root-causes', 'Penyebab QHSSE'],
  ['number-configs', 'Number Configurations'],
  ['emergency-simulation-topics', 'Topik Simulasi Tanggap Darurat'],
  ['permit-work-types', 'Tipe Pekerjaan'],
  ['permit-danger-source', 'Sumber Bahaya'],
  ['permit-attachment', 'Checklist Dokumen'],
  ['safety-checklist', 'Safety Checklist'],
  ['permit-category-apd', 'APD'],
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
