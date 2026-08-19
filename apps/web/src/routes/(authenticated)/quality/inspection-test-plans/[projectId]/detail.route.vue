<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import type { InspectionTestPlanRecord, InspectionTestPlanTemplate, InspectionTestPlanType } from '@southneuhof/api/routes/inspection-test-plans/inspection-test-plans.schemas'
import { Detail, DialogForm, NavigationHeader, TreeTable } from '@southneuhof/is-vue-framework'
import { Button, Card, Dialog, Icon } from '@southneuhof/is-vue-framework/components/base'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import { dataAdapter } from '@/framework/adapters/data/normalize'
import { itp } from '../itp.resource'
import { loadItpTemplate, loadItpTree } from '../itp.actions'
import { itpSchema, itpTypeOptions, type ItpCreate, type ItpUpdate } from '../itp.schema'
import ItpInspectorGrid, { type ItpInspectorGridEntry } from '../ItpInspectorGrid.vue'
import { allowsItpOperation, buildItpTree, type ItpTreePlanRow, type ItpTreeTableRow, type ItpTreeWorkItemRow } from '../itp.tree'

const route = useRoute('quality-inspection-test-plans-detail')
const projectId = String(route.params.projectId)

const treeRows = ref<ItpTreeWorkItemRow[]>([])
const treeLoading = ref(false)
const createLoading = ref(false)

async function reloadTree() {
  treeLoading.value = true
  try {
    treeRows.value = buildItpTree(await loadItpTree(projectId))
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    treeLoading.value = false
  }
}

onMounted(() => void reloadTree())

function isPlanRow(row: unknown): row is ItpTreePlanRow {
  return Boolean(row && typeof row === 'object' && (row as { kind?: unknown }).kind === 'itp')
}

function isWorkItemRow(row: unknown): row is ItpTreeWorkItemRow {
  return Boolean(row && typeof row === 'object' && (row as { kind?: unknown }).kind === 'work-item')
}

function typeName(type: unknown) {
  return itpTypeOptions.find((option) => option.id === type)?.name ?? String(type ?? '—')
}

function normalizeError(error: unknown) {
  return dataAdapter.normalizeError(error).message
}

function gridFromTemplate(template: InspectionTestPlanTemplate): ItpInspectorGridEntry[] {
  return template.inspectorTypes.map((inspector) => ({
    inspectorTypeId: inspector.id,
    inspectorTypeCode: inspector.code,
    inspectorTypeName: inspector.name,
    points: template.inspectionPoints.map((point) => ({ inspectionPointCode: point.code, inspectionPointName: point.name, value: false })),
  }))
}

function gridFromRecord(value: unknown): ItpInspectorGridEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const inspector = entry as { inspectorTypeId?: unknown; inspectorTypeCode?: unknown; inspectorTypeName?: unknown; points?: unknown }
    if (typeof inspector.inspectorTypeId !== 'string' || !Array.isArray(inspector.points)) return []
    return [
      {
        inspectorTypeId: inspector.inspectorTypeId,
        inspectorTypeCode: typeof inspector.inspectorTypeCode === 'string' ? inspector.inspectorTypeCode : undefined,
        inspectorTypeName: typeof inspector.inspectorTypeName === 'string' ? inspector.inspectorTypeName : undefined,
        points: inspector.points.flatMap((point) => {
          if (!point || typeof point !== 'object') return []
          const item = point as { inspectionPointCode?: unknown; inspectionPointName?: unknown; value?: unknown }
          return typeof item.inspectionPointCode === 'string'
            ? [{ inspectionPointCode: item.inspectionPointCode, inspectionPointName: typeof item.inspectionPointName === 'string' ? item.inspectionPointName : undefined, value: item.value === true }]
            : []
        }),
      },
    ]
  })
}

const formTypeOptions = ref<(typeof itpTypeOptions)[number][]>([])

function typeOptionsFor(types: readonly (InspectionTestPlanType | string)[]) {
  return itpTypeOptions.filter((option) => types.includes(option.id))
}

function canAddItp(row: ItpTreeWorkItemRow) {
  return row.node.isLeaf && row.node.availableTypes.length > 0
}

function findWorkItemRow(rows: readonly ItpTreeTableRow[], id: string): ItpTreeWorkItemRow | undefined {
  for (const row of rows) {
    if (row.kind === 'work-item' && row.node.id === id) return row
    const found = findWorkItemRow(row.children, id)
    if (found) return found
  }
  return undefined
}

async function openCreate(row: ItpTreeWorkItemRow) {
  if (!canAddItp(row) || createLoading.value) return
  const availableTypes = typeOptionsFor(row.node.availableTypes)
  const type = availableTypes[0]?.id
  if (!type) return
  createLoading.value = true
  try {
    const template = await loadItpTemplate(projectId)
    formTypeOptions.value = availableTypes
    createInitialData.value = { workItemId: row.node.id, type, frequency: 1, inspectors: gridFromTemplate(template) }
    updateAction.value = undefined
    formMode.value = 'create'
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    createLoading.value = false
  }
}

const createInitialData = ref<Partial<ItpCreate>>({})
const formMode = ref<'create' | 'update'>()
const updateAction = ref<ReturnType<typeof itp.update>>()
const formOpen = computed(() => formMode.value !== undefined)
const formTitle = computed(() => (formMode.value === 'update' ? 'Edit Inspection & Test Plan' : 'Create Inspection & Test Plan'))
const formSchema = computed(() => (formMode.value === 'update' ? itpSchema.update!.schema : itpSchema.create!.schema))
const formInitialData = computed(() => (formMode.value === 'create' ? createInitialData.value : undefined))
const formLoad = computed(() => (formMode.value === 'update' ? updateAction.value?.load : undefined))

function openEdit(row: ItpTreePlanRow) {
  if (!allowsItpOperation(row.plan, 'update')) return
  const leaf = findWorkItemRow(treeRows.value, row.parentId)
  formTypeOptions.value = typeOptionsFor([row.plan.type, ...(leaf?.node.availableTypes ?? [])])
  updateAction.value = itp.update({ id: String(row.plan.id) })
  formMode.value = 'update'
}

const baseFormFields = itp.create().fields as readonly (Record<string, unknown> & { key: string })[]
const detailFields = itp.detail({ id: '' }).fields
const formFields = computed(() =>
  baseFormFields.map((field) =>
    field.key === 'type'
      ? {
          ...field,
          label: 'Tahapan ITP',
          form: {
            ...(field.form as Record<string, unknown> | undefined),
            renderer: 'radio',
            source: formTypeOptions.value,
            props: { ...((field.form as { props?: Record<string, unknown> } | undefined)?.props ?? {}), required: true },
          },
        }
      : field
  )
)

async function submitForm(input: Record<string, unknown>) {
  if (formMode.value === 'create') {
    const result = await itp.create().run(input as ItpCreate)
    await reloadTree()
    formMode.value = undefined
    toast.success('Inspection & Test Plan created.')
    return result
  }
  if (!updateAction.value) throw new Error('No ITP selected.')
  const result = await updateAction.value.run(input as ItpUpdate)
  await reloadTree()
  formMode.value = undefined
  toast.success('Inspection & Test Plan updated.')
  return result
}

const viewOpen = ref(false)
const viewLoading = ref(false)
const viewRecord = ref<InspectionTestPlanRecord>()

async function openView(row: ItpTreePlanRow) {
  if (!allowsItpOperation(row.plan, 'detail')) return
  viewRecord.value = undefined
  viewOpen.value = true
  viewLoading.value = true
  try {
    viewRecord.value = (await itp.detail({ id: String(row.plan.id) }).run()) as InspectionTestPlanRecord
  } catch (error) {
    viewOpen.value = false
    toast.error(normalizeError(error))
  } finally {
    viewLoading.value = false
  }
}

async function deletePlan(row: ItpTreePlanRow) {
  if (!allowsItpOperation(row.plan, 'delete')) return
  await itp.delete({ id: String(row.plan.id) }).run()
  await reloadTree()
  toast.success('Inspection & Test Plan deleted.')
}

function deleteError(error: unknown) {
  toast.error(normalizeError(error))
}

const treeFields = {
  item: { label: 'Work item', read: (row: ItpTreeTableRow) => (row.kind === 'work-item' ? row.node.name : `${typeName(row.plan.type)} ITP`) },
  type: { label: 'Type', read: (row: ItpTreeTableRow) => (row.kind === 'itp' ? typeName(row.plan.type) : '—') },
  criteria: { label: 'Criteria', read: (row: ItpTreeTableRow) => (row.kind === 'itp' ? row.plan.criteria : '—') },
  procedureCode: { label: 'Procedure Code', read: (row: ItpTreeTableRow) => (row.kind === 'itp' ? row.plan.procedureCode : '—') },
  specification: { label: 'Specification', read: (row: ItpTreeTableRow) => (row.kind === 'itp' ? row.plan.specification : '—') },
  method: { label: 'Method', read: (row: ItpTreeTableRow) => (row.kind === 'itp' ? row.plan.method : '—') },
  frequency: { label: 'Frequency', read: (row: ItpTreeTableRow) => (row.kind === 'itp' ? row.plan.frequency : '—') },
}

const treeChildren = (row: ItpTreeTableRow) => row.children
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <NavigationHeader title="Inspection &amp; Test Plan" description="Project work items and active inspection plans." :back-to="{ name: 'quality-inspection-test-plans' }" back-label="Kembali" />

    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <p v-if="treeLoading" class="p-4 text-center text-on-surface-variant" role="status" aria-live="polite">Loading…</p>
      <TreeTable v-else :fields="treeFields" :data="treeRows" :children="treeChildren" tree-column="item" :pagination="false" :row-key="(row: ItpTreeTableRow) => row.key">
        <template #tree-cell="{ value, record }">
          <span class="truncate" :class="isPlanRow(record) ? 'text-on-surface-variant' : 'font-medium'">{{ value }}</span>
        </template>
        <template #row-actions="{ record }">
          <div class="flex flex-nowrap items-center justify-end gap-1">
            <template v-if="isWorkItemRow(record)">
              <Button v-if="canAddItp(record)" type="button" variant="tonal" :disabled="createLoading" @click.stop="openCreate(record)">
                <template #icon><Icon name="add" size="base" /></template>
                Create
              </Button>
            </template>
            <template v-else-if="isPlanRow(record)">
              <Button v-if="allowsItpOperation(record.plan, 'detail')" kind="icon" variant="standard" aria-label="View" @click.stop="openView(record)">
                <template #icon><Icon name="eye" size="base" /></template>
              </Button>
              <Button v-if="allowsItpOperation(record.plan, 'update')" kind="icon" variant="standard" aria-label="Edit" @click.stop="openEdit(record)">
                <template #icon><Icon name="edit" size="base" /></template>
              </Button>
              <ConfirmationDialog
                v-if="allowsItpOperation(record.plan, 'delete')"
                title="Delete Inspection & Test Plan?"
                message="The plan will be soft deleted."
                :on-confirm="() => deletePlan(record)"
                :on-error="deleteError"
              >
                <template #trigger>
                  <Button kind="icon" variant="standard" color="error" aria-label="Delete" @click.stop>
                    <template #icon><Icon name="delete-bin" size="base" /></template>
                  </Button>
                </template>
              </ConfirmationDialog>
            </template>
          </div>
        </template>
      </TreeTable>
    </Card>

    <DialogForm
      v-if="formOpen"
      :key="`${formMode}-${updateAction?.id ?? createInitialData.workItemId ?? ''}`"
      :open="formOpen"
      :title="formTitle"
      :fields="formFields as never"
      :schema="formSchema as never"
      :initial-data="formInitialData"
      :load="formLoad"
      :submit="submitForm"
      @update:open="
        (open) => {
          if (!open) formMode = undefined
        }
      "
    >
      <template #input:inspectors="{ value, setValue, disabled }">
        <ItpInspectorGrid :model-value="Array.isArray(value) ? value as ItpInspectorGridEntry[] : []" :disabled="disabled" @update:model-value="setValue" />
      </template>
    </DialogForm>

    <Dialog
      :model-value="viewOpen"
      @update:model-value="
        (open) => {
          viewOpen = open
          if (!open) viewRecord = undefined
        }
      "
    >
      <template #title>View Inspection &amp; Test Plan</template>
      <template #content>
        <p v-if="viewLoading" role="status" aria-live="polite">Loading…</p>
        <Detail v-else-if="viewRecord" :fields="detailFields as never" :data="viewRecord">
          <template #value:inspectors="{ value }">
            <ItpInspectorGrid :model-value="gridFromRecord(value)" disabled />
          </template>
        </Detail>
      </template>
    </Dialog>
  </div>
</template>
