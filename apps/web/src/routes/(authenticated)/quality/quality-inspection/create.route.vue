<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import type { QualityInspectionTreeNode } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import QualityInspectionWorkItemSelector from './QualityInspectionWorkItemSelector.vue'
import { loadCreateContext } from './quality-inspection.actions'
import { qualityInspection } from './quality-inspection.resource'
import type { QualityInspectionCreate } from './quality-inspection.schema'

const route = useRoute('quality-quality-inspection-create')
const context = ref<{ tree: QualityInspectionTreeNode[]; activeItpTypes?: string[] }>({ tree: [] })
const initialData = ref<Partial<QualityInspectionCreate>>({})
const projectId = typeof route.query.projectId === 'string' ? route.query.projectId : ''
const loadedProjectId = ref('')
const loadingProjectId = ref('')
let contextRequest = 0

async function ensureContext(nextProjectId: string) {
  if (!nextProjectId || nextProjectId === loadedProjectId.value || nextProjectId === loadingProjectId.value) return
  loadingProjectId.value = nextProjectId
  const request = ++contextRequest
  try {
    const loaded = await loadCreateContext(nextProjectId, 'create')
    if (request !== contextRequest) return
    context.value = loaded as typeof context.value
    loadedProjectId.value = nextProjectId
  } catch {
    if (request === contextRequest) context.value = { tree: [] }
  } finally {
    if (loadingProjectId.value === nextProjectId) loadingProjectId.value = ''
  }
}

function contextFor(draft: Record<string, unknown>) {
  void ensureContext(typeof draft.projectId === 'string' ? draft.projectId : '')
  return context.value
}

onMounted(async () => {
  await ensureContext(projectId)
  initialData.value = { projectId }
})

const action = qualityInspection.create()
</script>

<template>
  <FormView v-bind="action" title="Buat Inspection/Test" :initial-data="initialData">
    <template #input:selectedRows="{ value, setValue, draft }">
      <QualityInspectionWorkItemSelector :context="contextFor(draft)" :root-id="typeof draft.workItemCategoryId === 'string' ? draft.workItemCategoryId : undefined" :model-value="Array.isArray(value) ? value as never[] : []" @update:model-value="setValue" />
    </template>
  </FormView>
</template>
