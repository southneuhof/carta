<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Detail, FormView } from '@southneuhof/is-vue-framework'
import { Card } from '@southneuhof/is-vue-framework/components/base'
import type { QualityInspectionTreeNode } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import QualityInspectionWorkItemSelector from '../../QualityInspectionWorkItemSelector.vue'
import { loadScheduleContext } from '../../quality-inspection.actions'
import { qualityInspection } from '../../quality-inspection.resource'
import type { QualityInspectionCreate } from '../../quality-inspection.schema'

const route = useRoute('quality-quality-inspection-schedules-create')
const scheduleId = String(route.params.scheduleId)
const context = ref<{ tree: QualityInspectionTreeNode[]; activeItpTypes?: string[] }>({ tree: [] })
const schedule = ref<{ startDate?: string | null; endDate?: string | null }>({})
const projectName = ref('')
const initialData = ref<Partial<QualityInspectionCreate>>({ scheduleId })
const rootId = ref('')
const loaded = ref(false)
const base = qualityInspection.create()
const fields = (base.fields as readonly { key: string }[]).filter((field) => ['targetDate', 'locationZone', 'selectedRows'].includes(field.key))
const form = computed(() => ({
  ...base,
  fields,
  initialData: initialData.value,
  run: (input: Record<string, unknown>) => qualityInspection.create().run({ scheduleId, targetDate: String(input.targetDate ?? ''), locationZone: typeof input.locationZone === 'string' ? input.locationZone : undefined, selectedRows: input.selectedRows } as never),
}))
const origin = computed(() => ({
  scheduleId,
  projectName: projectName.value,
  workItemCategoryName: context.value.tree.find((node) => node.id === rootId.value)?.name ?? '',
  scheduleStartDate: schedule.value.startDate,
  scheduleEndDate: schedule.value.endDate,
}))
const originFields = {
  scheduleId: { label: 'Jadwal' },
  projectName: { label: 'Proyek' },
  workItemCategoryName: { label: 'Jenis Pekerjaan' },
  scheduleStartDate: { label: 'Periode Mulai', display: { format: 'date' } },
  scheduleEndDate: { label: 'Periode Selesai', display: { format: 'date' } },
}

onMounted(async () => {
  const loadedContext = await loadScheduleContext(scheduleId)
  context.value = loadedContext.context as typeof context.value
  schedule.value = loadedContext.schedule
  projectName.value = loadedContext.project.name
  rootId.value = String(loadedContext.schedule?.workItemId ?? '')
  initialData.value = { scheduleId, targetDate: '' }
  loaded.value = true
})
</script>

<template>
  <div v-if="loaded" class="flex flex-col gap-2">
    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <div class="border-b border-outline-variant px-5 py-4">
        <h2 class="font-semibold">Asal Jadwal</h2>
        <p class="mt-1 text-sm text-on-surface-variant">Data jadwal tidak dapat diubah.</p>
      </div>
      <div class="p-5"><Detail :fields="originFields as never" :data="origin" /></div>
    </Card>
    <FormView v-bind="form" title="Buat Inspection/Test dari Jadwal" description="Target Pelaksanaan dapat diubah. Jadwal dan periode mengikuti data sumber.">
      <template #input:selectedRows="{ value, setValue }">
        <QualityInspectionWorkItemSelector :context="context" :root-id="rootId" :model-value="Array.isArray(value) ? value as never[] : []" @update:model-value="setValue" />
      </template>
    </FormView>
  </div>
  <p v-else class="p-6 text-center" role="status">Memuat…</p>
</template>
