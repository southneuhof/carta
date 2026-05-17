<script setup lang="ts">
defineProps<{
  sectionName: string
  sectionTypeCode: string
  visible: boolean
  updatedAt: string | null
  message?: string
}>()
</script>

<template>
  <section class="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="text-base font-semibold">{{ sectionName }}</h3>
      <span class="rounded bg-amber-100 px-2 py-1 text-xs font-medium">Unsupported</span>
    </div>

    <dl class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
      <div>
        <dt class="font-medium">Section Type</dt>
        <dd class="font-mono">{{ sectionTypeCode }}</dd>
      </div>
      <div>
        <dt class="font-medium">Visible</dt>
        <dd>{{ visible ? 'Yes' : 'No' }}</dd>
      </div>
      <div class="md:col-span-2">
        <dt class="font-medium">Updated At</dt>
        <dd>{{ updatedAt || '-' }}</dd>
      </div>
    </dl>

    <p class="mt-3 text-sm">
      {{ message || 'This section type is not supported by this admin version and is read-only.' }}
    </p>
  </section>
</template>
