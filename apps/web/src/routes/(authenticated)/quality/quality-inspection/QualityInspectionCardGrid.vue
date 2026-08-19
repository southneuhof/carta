<script setup lang="ts">
import { ref } from 'vue'
import { Button, Card, Chip, Dialog, Icon, ImagePreview } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'
import { statusColors, statusLabels, stepLabels } from './quality-inspection.schema'

const props = defineProps<{
  records: readonly Record<string, unknown>[]
  canDelete: (record: Record<string, unknown>) => boolean
  deleteRecord: (record: Record<string, unknown>) => Promise<unknown>
}>()
const deleting = ref(false)

type Documentation = { name: string; fileAttachment: string | null }

const photoNames = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] as const
function value(record: Record<string, unknown>, key: string) {
  return record[key] == null || record[key] === '' ? '—' : String(record[key])
}

function image(value: unknown) {
  if (value && typeof value === 'object') {
    const item = value as { url?: unknown; path?: unknown }
    if (typeof item.url === 'string') return item.url
    if (typeof item.path === 'string') return fileUrl(item.path)
  }
  return typeof value === 'string' && value ? fileUrl(value) : undefined
}

function documentations(record: Record<string, unknown>) {
  return Array.isArray(record.documentations) ? record.documentations as Documentation[] : []
}

function photo(record: Record<string, unknown>, name: string) {
  return image(documentations(record).find((item) => item.name === name)?.fileAttachment)
}

function hasPhotos(record: Record<string, unknown>) {
  return photoNames.some((name) => Boolean(photo(record, name)))
}

function date(value: unknown) {
  if (!value) return '—'
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString('id-ID')
}

function statusLabel(value: unknown) {
  return statusLabels[String(value)] ?? String(value || '—')
}

function statusColor(value: unknown) {
  return statusColors[String(value)] ?? 'info'
}

function stepLabel(value: unknown) {
  return stepLabels[String(value)] ?? String(value || '—')
}

async function remove(record: Record<string, unknown>, setOpen: (value: boolean) => void) {
  if (deleting.value) return
  deleting.value = true
  try {
    await props.deleteRecord(record)
    setOpen(false)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="!records.length" class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-6 py-16 text-center">
    <Icon name="file-list-2" size="4xl" class="text-on-surface-variant" />
    <h2 class="mt-4 text-base font-semibold">Belum ada laporan Inspection/Test</h2>
  </div>

  <div v-else class="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
    <Card
      v-for="record in records"
      :key="String(record.id)"
      variant="outlined"
      color="surfaceContainer"
      class="group overlay relative h-full overflow-hidden p-0 after:z-10 after:bg-on-surface-hover focus-visible:after:bg-on-surface-active active:after:bg-on-surface-active"
    >
      <RouterLink
        :to="{ name: 'quality-quality-inspection-detail', params: { qualityInspectionId: String(record.id) } }"
        class="relative flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <div class="flex items-center justify-between gap-3 p-5 pb-0">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest text-on-surface-variant">
              <img v-if="image(record.createdByPhoto)" :src="image(record.createdByPhoto)" alt="" class="h-full w-full object-cover" />
              <Icon v-else name="user" size="lg" aria-hidden="true" />
            </div>
            <div class="min-w-0 text-sm">
              <p class="truncate font-semibold">{{ value(record, 'createdByName') }}</p>
              <p class="truncate text-on-surface-variant">{{ date(record.createdAt) }}</p>
            </div>
          </div>
          <Chip variant="tonal" :color="statusColor(record.statusCode)">{{ statusLabel(record.statusCode) }}</Chip>
        </div>

        <div class="grid grid-cols-4 gap-px bg-outline-variant p-5 pb-0">
          <div v-for="name in photoNames" :key="name" class="min-w-0 bg-surface-container-high p-1">
            <div class="relative aspect-square w-full overflow-hidden rounded-lg">
              <ImagePreview v-if="photo(record, name)" :image-u-r-l="photo(record, name)" :disable-controls="true" class="h-full w-full rounded-lg" />
              <div v-else class="flex h-full w-full items-center justify-center bg-surface-container-highest text-on-surface-variant">
                <Icon name="image" size="lg" aria-hidden="true" />
              </div>
              <span class="pointer-events-none absolute bottom-1 left-1 z-10 rounded bg-surface/[88%] px-1 py-0.5 text-[10px] text-on-surface-variant">{{ name }}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-1 flex-col gap-4 p-5 pb-16">
          <p v-if="!hasPhotos(record)" class="text-sm text-on-surface-variant">Dokumentasi belum dilengkapi</p>
          <div>
            <h2 class="truncate text-lg font-semibold tracking-tight group-hover:text-primary">{{ value(record, 'projectName') }}</h2>
            <p class="mt-1 text-sm text-on-surface-variant">{{ value(record, 'number') }}</p>
          </div>

          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-outline-variant pt-4 text-sm">
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Target Pelaksanaan</dt>
              <dd class="mt-0.5 truncate font-medium">{{ date(record.targetDate) }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Tahap</dt>
              <dd class="mt-0.5 truncate font-medium">{{ stepLabel(record.stepCode) }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Jenis Pekerjaan</dt>
              <dd class="mt-0.5 line-clamp-2 font-medium">{{ value(record, 'workItemCategoryName') }}</dd>
            </div>
            <div class="min-w-0">
              <dt class="text-on-surface-variant">Area/Zona Kerja</dt>
              <dd class="mt-0.5 line-clamp-2 font-medium">{{ value(record, 'locationZone') }}</dd>
            </div>
          </dl>
        </div>
      </RouterLink>

      <Dialog v-if="props.canDelete(record)">
        <template #trigger>
          <Button
            type="button"
            kind="icon"
            variant="standard"
            color="error"
            aria-label="Hapus laporan"
            class="absolute bottom-3 right-3 z-20"
            @click.stop
          >
            <template #icon><Icon name="delete-bin" size="base" /></template>
          </Button>
        </template>
        <template #title>Hapus laporan?</template>
        <template #description>Tindakan ini tidak dapat dibatalkan.</template>
        <template #footer="{ setOpen }">
          <div class="flex w-full justify-end gap-2">
            <Button type="button" variant="text" :disabled="deleting" @click="setOpen(false)">Batal</Button>
            <Button type="button" color="error" :disabled="deleting" @click="remove(record, setOpen)">Hapus</Button>
          </div>
        </template>
      </Dialog>
    </Card>
  </div>
</template>
