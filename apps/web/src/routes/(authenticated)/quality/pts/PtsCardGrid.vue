<script setup lang="ts">
import { Button, Card, Chip, ImagePreview } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'

defineProps<{ records: readonly Record<string, unknown>[] }>()
const emit = defineEmits<{ delete: [id: string] }>()

function value(record: Record<string, unknown>, key: string) {
  return record[key] == null || record[key] === '' ? '—' : String(record[key])
}

function image(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'object' && value !== null && typeof (value as { url?: unknown }).url === 'string') return (value as { url: string }).url
  return fileUrl(String(value))
}

function relation(record: Record<string, unknown>, key: string, fallbackKey: string) {
  const value = record[key]
  if (value && typeof value === 'object' && typeof (value as { name?: unknown }).name === 'string') return (value as { name: string }).name
  return valueOf(record, fallbackKey)
}

function valueOf(record: Record<string, unknown>, key: string) {
  return record[key] == null || record[key] === '' ? '—' : String(record[key])
}

function rootCauseNames(record: Record<string, unknown>) {
  if (!Array.isArray(record.rootCauses)) return '—'
  const names = record.rootCauses.flatMap((cause) => {
    if (!cause || typeof cause !== 'object') return []
    const name = (cause as { name?: unknown }).name
    return typeof name === 'string' ? [name] : []
  })
  return names.join(', ') || '—'
}
</script>

<template>
  <div v-if="!records.length" class="p-6 text-center text-on-surface-variant">No PTS reports.</div>
  <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <RouterLink v-for="record in records" :key="String(record.id)" :to="{ name: 'quality-pts-detail', params: { ptsId: String(record.id) } }" class="outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <Card variant="outlined" color="surfaceContainer" class="h-full transition hover:outline-primary">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ value(record, 'number') }}</p>
            <p class="truncate text-sm text-on-surface-variant">{{ value(record, 'projectName') }}</p>
          </div>
          <Chip variant="tonal" :color="record.statusCode === 'close' ? 'success' : record.statusCode === 'on-progress' ? 'warning' : 'info'">{{ value(record, 'statusCode') }}</Chip>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <ImagePreview v-if="image(record.imgBefore)" :image-u-r-l="image(record.imgBefore)" :disable-controls="true" class="h-28 w-full" />
          <div v-else class="flex h-28 items-center justify-center rounded-xl bg-surface-container-high text-xs text-on-surface-variant">No before image</div>
          <ImagePreview v-if="image(record.imgAfter)" :image-u-r-l="image(record.imgAfter)" :disable-controls="true" class="h-28 w-full" />
          <div v-else class="flex h-28 items-center justify-center rounded-xl bg-surface-container-high text-xs text-on-surface-variant">No after image</div>
        </div>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Reporter</dt><dd class="truncate">{{ valueOf(record, 'createdByName') !== '—' ? valueOf(record, 'createdByName') : valueOf(record, 'createdBy') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Reported</dt><dd>{{ valueOf(record, 'createdAt') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Criteria</dt><dd>{{ value(record, 'criteriaCode') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Division</dt><dd class="truncate">{{ relation(record, 'division', 'divisionName') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">PTS category</dt><dd class="truncate">{{ relation(record, 'ptsWorkCategory', 'ptsWorkCategoryName') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Work category</dt><dd class="truncate">{{ relation(record, 'workItemCategory', 'workItemCategoryName') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Work item</dt><dd class="truncate">{{ relation(record, 'workItem', 'workItemName') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Zone</dt><dd class="truncate">{{ value(record, 'locationZone') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Step</dt><dd>{{ value(record, 'stepCode') }}</dd></div>
          <div class="flex justify-between gap-3"><dt class="text-on-surface-variant">Location</dt><dd class="truncate">{{ value(record, 'location') }}</dd></div>
          <div><dt class="text-on-surface-variant">Root causes</dt><dd>{{ rootCauseNames(record) }}</dd></div>
          <div><dt class="text-on-surface-variant">Description</dt><dd class="line-clamp-3">{{ value(record, 'description') }}</dd></div>
        </dl>
        <div class="flex justify-end">
          <Button v-if="Array.isArray(record.allowedOperations) && record.allowedOperations.includes('delete')" type="button" kind="icon" variant="standard" color="error" aria-label="Delete" @click.stop.prevent="emit('delete', String(record.id))">Delete</Button>
        </div>
      </Card>
    </RouterLink>
  </div>
</template>
