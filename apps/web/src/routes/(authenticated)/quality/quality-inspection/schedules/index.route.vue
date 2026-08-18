<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { Button } from '@southneuhof/is-vue-framework/components/base'
import { loadSchedules } from '../quality-inspection.actions'

const router = useRouter()
const rows = ref<Record<string, unknown>[]>([])
const loading = ref(true)

onMounted(async () => {
  try { rows.value = await loadSchedules() as Record<string, unknown>[] } finally { loading.value = false }
})

const fields = {
  project: { label: 'Proyek', read: (row: any) => row.project?.name ?? '—' },
  workItem: { label: 'Jenis Pekerjaan', read: (row: any) => row.workItem?.name ?? '—' },
  startDate: { label: 'Mulai', read: (row: any) => row.schedule?.startDate ?? '—' },
  endDate: { label: 'Selesai', read: (row: any) => row.schedule?.endDate ?? '—' },
}
</script>

<template>
  <ListView :table="{ data: rows, fields, pagination: false }" title="Jadwal Inspection/Test">
    <template #row-actions="{ record }">
      <Button type="button" variant="tonal" :disabled="loading" @click="router.push({ name: 'quality-quality-inspection-schedules-create', params: { scheduleId: String((record as Record<string, any>).schedule?.id) } })">Buat Inspection/Test</Button>
    </template>
  </ListView>
</template>
