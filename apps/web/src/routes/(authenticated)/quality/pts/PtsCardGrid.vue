<script setup lang="ts">
import { Button, Card, Chip, Icon, ImagePreview } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'

defineProps<{ records: readonly Record<string, unknown>[] }>()
const emit = defineEmits<{ delete: [id: string] }>()

type ChipColor = 'info' | 'warning' | 'success'

const statusLabels: Record<string, string> = {
  open: 'Open',
  'on-progress': 'On progress',
  close: 'Closed',
}

const statusColors: Record<string, ChipColor> = {
  open: 'info',
  'on-progress': 'warning',
  close: 'success',
}

const imageItems = [
  { key: 'imgBefore', label: 'Before' },
  { key: 'imgProcess', label: 'Process' },
  { key: 'imgAfter', label: 'After' },
] as const

function value(record: Record<string, unknown>, key: string) {
  return record[key] == null || record[key] === '' ? '—' : String(record[key])
}

function image(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'object' && value !== null && typeof (value as { url?: unknown }).url === 'string') return (value as { url: string }).url
  return fileUrl(String(value))
}

function relation(record: Record<string, unknown>, key: string, fallbackKey: string) {
  const related = record[key]
  if (related && typeof related === 'object' && typeof (related as { name?: unknown }).name === 'string') return (related as { name: string }).name
  return value(record, fallbackKey)
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

function statusLabel(value: unknown) {
  return statusLabels[String(value)] ?? String(value || 'Unknown')
}

function statusColor(value: unknown) {
  return statusColors[String(value)] ?? 'info'
}
</script>

<template>
  <div v-if="!records.length" class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-16 text-center">
    <Icon name="file-list-2" size="4xl" class="text-on-surface-variant" />
    <h2 class="mt-4 text-base font-semibold">No PTS reports found</h2>
    <p class="mt-1 max-w-md text-sm text-on-surface-variant">Try another status, date range, or root cause filter.</p>
  </div>

  <div v-else class="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
    <Card
      v-for="record in records"
      :key="String(record.id)"
      variant="outlined"
      color="surfaceContainer"
      class="h-full p-0 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-elevation-1"
    >
      <RouterLink
        :to="{ name: 'quality-pts-detail', params: { ptsId: String(record.id) } }"
        class="group flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <div class="grid grid-cols-3 gap-px bg-outline-variant">
          <div v-for="item in imageItems" :key="item.key" class="min-w-0 bg-surface-container-high p-2">
            <div class="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              <span>{{ item.label }}</span>
              <Icon name="image" size="xs" />
            </div>
            <ImagePreview v-if="image(record[item.key])" :image-u-r-l="image(record[item.key])" :disable-controls="true" class="aspect-[4/3] h-36 w-full rounded-lg" />
            <div v-else class="flex aspect-[4/3] min-h-0 w-full items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
              <Icon name="image" size="lg" />
            </div>
          </div>
        </div>

        <div class="flex flex-1 flex-col gap-4 p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold tracking-tight group-hover:text-primary">{{ value(record, 'number') }}</h2>
              <p class="mt-1 flex items-center gap-1.5 truncate text-sm text-on-surface-variant">
                <Icon name="building-2" size="sm" />
                {{ value(record, 'projectName') }}
              </p>
            </div>
            <Chip variant="tonal" :color="statusColor(record.statusCode)">{{ statusLabel(record.statusCode) }}</Chip>
          </div>

          <p class="flex items-start gap-2 text-sm text-on-surface-variant">
            <Icon name="map-pin" size="base" class="mt-0.5 shrink-0" />
            <span class="line-clamp-2">{{ value(record, 'location') }}</span>
          </p>

          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-outline-variant pt-4 text-sm">
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Criteria</dt>
              <dd class="mt-0.5 font-medium">{{ value(record, 'criteriaCode') }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Step</dt>
              <dd class="mt-0.5 font-medium">{{ value(record, 'stepCode') }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Division</dt>
              <dd class="mt-0.5 truncate font-medium">{{ relation(record, 'division', 'divisionName') }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Reported</dt>
              <dd class="mt-0.5 truncate font-medium">{{ value(record, 'createdAt') }}</dd>
            </div>
          </dl>

          <div class="mt-auto border-t border-outline-variant pt-4 text-sm">
            <p class="text-on-surface-variant">Root causes</p>
            <p class="mt-1 line-clamp-2 font-medium">{{ rootCauseNames(record) }}</p>
            <p class="mt-3 line-clamp-2 text-on-surface-variant">{{ value(record, 'description') }}</p>
            <span class="mt-4 inline-flex items-center gap-1.5 font-medium text-primary">
              Open report
              <Icon name="arrow-right" size="sm" class="transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </RouterLink>

      <div v-if="Array.isArray(record.allowedOperations) && record.allowedOperations.includes('delete')" class="flex justify-end border-t border-outline-variant px-5 py-2">
        <Button type="button" variant="text" color="error" @click.stop="emit('delete', String(record.id))">
          <template #icon><Icon name="delete-bin" size="base" /></template>
          Delete
        </Button>
      </div>
    </Card>
  </div>
</template>
