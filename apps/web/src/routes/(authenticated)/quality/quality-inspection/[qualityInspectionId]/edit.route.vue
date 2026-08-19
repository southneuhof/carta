<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import type { QualityInspectionTreeNode } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import QualityInspectionWorkItemSelector from '../QualityInspectionWorkItemSelector.vue'
import { loadCreateContext } from '../quality-inspection.actions'
import { qualityInspection } from '../quality-inspection.resource'
import type { QualityInspectionUpdate } from '../quality-inspection.schema'

const route = useRoute('quality-quality-inspection-edit')
const id = String(route.params.qualityInspectionId)
const context = ref<{ tree: QualityInspectionTreeNode[]; activeItpTypes?: string[] }>({ tree: [] })
const initialData = ref<Partial<QualityInspectionUpdate>>({})
const action = qualityInspection.update({ id })
const form = computed(() => ({
  ...action,
  initialData: initialData.value,
  load: async () => {
    const detail = (await qualityInspection.detail({ id }).run()) as Record<string, any>
    if (!Array.isArray(detail.allowedOperations) || !detail.allowedOperations.includes('update')) throw new Error('Inspection/Test ini tidak dapat diedit.')
    const selectedRows = Array.isArray(detail.workItems)
      ? detail.workItems.map((item: Record<string, any>) => ({
          workItemId: item.row.workItemId,
          volume: Number(item.row.volume),
          itpTypeCodes: Array.isArray(item.snapshots) ? item.snapshots.map((snapshot: Record<string, any>) => snapshot.type) : [],
        }))
      : []
    initialData.value = {
      divisionId: detail.divisionId,
      projectId: detail.projectId,
      qualityWorkCategoryId: detail.qualityWorkCategoryId,
      workItemCategoryId: detail.workItemCategoryId,
      targetDate: detail.targetDate,
      locationZone: detail.locationZone,
      selectedRows,
    }
    context.value = (await loadCreateContext(String(detail.projectId), 'update')) as typeof context.value
    return initialData.value
  },
}))
</script>

<template>
  <FormView v-bind="form" title="Edit Inspection/Test">
    <template #input:selectedRows="{ value, setValue, draft }">
      <QualityInspectionWorkItemSelector
        :context="context"
        :root-id="typeof draft.workItemCategoryId === 'string' ? draft.workItemCategoryId : undefined"
        :model-value="Array.isArray(value) ? value as never[] : []"
        @update:model-value="setValue"
      />
    </template>
  </FormView>
</template>
