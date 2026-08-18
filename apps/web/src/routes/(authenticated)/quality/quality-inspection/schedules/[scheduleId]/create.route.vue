<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import type { QualityInspectionTreeNode } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import QualityInspectionWorkItemSelector from '../../QualityInspectionWorkItemSelector.vue'
import { loadScheduleContext } from '../../quality-inspection.actions'
import { qualityInspection } from '../../quality-inspection.resource'
import type { QualityInspectionCreate } from '../../quality-inspection.schema'

const route = useRoute('quality-quality-inspection-schedules-create')
const scheduleId = String(route.params.scheduleId)
const context = ref<{ tree: QualityInspectionTreeNode[]; activeItpTypes?: string[] }>({ tree: [] })
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

onMounted(async () => {
  const loadedContext = await loadScheduleContext(scheduleId)
  context.value = loadedContext.context as typeof context.value
  rootId.value = String(loadedContext.schedule?.workItemId ?? '')
  initialData.value = { scheduleId, targetDate: '' }
  loaded.value = true
})
</script>

<template>
  <FormView v-if="loaded" v-bind="form" title="Buat Inspection/Test dari Jadwal" description="Target Pelaksanaan is entered once. The schedule period is read-only origin data.">
    <template #input:selectedRows="{ value, setValue }">
      <QualityInspectionWorkItemSelector :context="context" :root-id="rootId" :model-value="Array.isArray(value) ? value as never[] : []" @update:model-value="setValue" />
    </template>
  </FormView>
  <p v-else class="p-6 text-center" role="status">Memuat…</p>
</template>
