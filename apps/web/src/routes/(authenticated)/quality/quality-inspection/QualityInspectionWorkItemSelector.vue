<script setup lang="ts">
import { computed, watch } from 'vue'
import { Form, Table, TreeTable } from '@southneuhof/is-vue-framework'
import { Button, Card, Chip, Icon } from '@southneuhof/is-vue-framework/components/base'
import type { QualityInspectionTreeNode, SelectedWorkItemInput } from '@southneuhof/api/routes/quality-inspection/quality-inspection.schemas'
import { itpTypeLabels, itpTypeOptions } from './quality-inspection.schema'
import { selectableLeaves, selectedRowsForRoot, treeForRoot } from './quality-inspection.selector'

type Context = { tree: QualityInspectionTreeNode[]; activeItpTypes?: string[] }
type Candidate = QualityInspectionTreeNode

const props = defineProps<{ context: Context; modelValue: SelectedWorkItemInput[]; rootId?: string | null }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: SelectedWorkItemInput[]): void }>()

const treeRows = computed(() => treeForRoot(props.context.tree ?? [], props.rootId))
const candidates = computed(() => selectableLeaves(props.context.tree ?? [], props.rootId))
const scopedModelValue = computed(() => selectedRowsForRoot(props.modelValue, props.context.tree ?? [], props.rootId))
const selectedIds = computed(() => new Set(scopedModelValue.value.map((row) => row.workItemId)))

const selectedFields = {
  item: { label: 'Item Pekerjaan', read: (row: SelectedInspectionRow) => row.name },
  method: { label: 'Metode Inspeksi', read: (row: SelectedInspectionRow) => row.itpTypeCodes.map((type) => itpTypeLabels[type] ?? type).join(', ') },
  volume: { label: 'Volume', read: (row: SelectedInspectionRow) => `${row.volume} ${row.uomName ?? ''}`.trim() },
}
const volumeFields = {
  volume: { label: 'Volume', form: { renderer: 'number', props: { min: 0.01, step: 0.01, required: true } } },
}

type SelectedInspectionRow = SelectedWorkItemInput & { id: string; name: string; uomName: string | null }

function selectedRow(row: SelectedWorkItemInput): SelectedInspectionRow {
  const node = candidates.value.find((candidate) => candidate.id === row.workItemId)
  return { ...row, id: row.workItemId, name: node?.name ?? row.workItemId, uomName: node?.uomName ?? null }
}

function fieldsFor(row: SelectedInspectionRow) {
  const candidate = candidates.value.find((item) => item.id === row.workItemId)
  const availableTypes = new Set(candidate?.itps.map((itp) => itp.type))
  return {
    itpTypeCodes: { label: 'Metode Inspeksi', form: { renderer: 'checkbox-group', source: itpTypeOptions.filter((option) => availableTypes.has(option.id)), props: { required: true } } },
  }
}

const selectedRows = computed(() => scopedModelValue.value.map(selectedRow))

watch([() => props.rootId, treeRows], () => {
  if (!props.rootId) {
    if (props.modelValue.length) emit('update:modelValue', [])
    return
  }
  if (!treeRows.value.length) return
  const scoped = selectedRowsForRoot(props.modelValue, props.context.tree ?? [], props.rootId)
  if (scoped.length !== props.modelValue.length) emit('update:modelValue', scoped)
})

function toggle(node: Candidate) {
  if (!node.isLeaf || !node.itps.length) return
  if (selectedIds.value.has(node.id))
    emit(
      'update:modelValue',
      scopedModelValue.value.filter((row) => row.workItemId !== node.id)
    )
  else emit('update:modelValue', [...scopedModelValue.value, { workItemId: node.id, volume: 1, itpTypeCodes: [node.itps[0].type as SelectedWorkItemInput['itpTypeCodes'][number]] }])
}

function updateRow(row: SelectedInspectionRow, value: Record<string, unknown>) {
  const volume = Number(value.volume)
  const itpTypeCodes = Array.isArray(value.itpTypeCodes) ? value.itpTypeCodes.filter((item): item is SelectedWorkItemInput['itpTypeCodes'][number] => typeof item === 'string') : row.itpTypeCodes
  if (!Number.isFinite(volume) || volume <= 0 || !itpTypeCodes.length) return
  emit(
    'update:modelValue',
    scopedModelValue.value.map((item) => (item.workItemId === row.workItemId ? { ...item, volume, itpTypeCodes } : item))
  )
}

function children(row: QualityInspectionTreeNode) {
  return row.children
}

function isCandidate(row: unknown): row is Candidate {
  return Boolean(row && typeof row === 'object' && 'id' in row && candidates.value.some((item) => item.id === (row as { id: string }).id))
}

function categoryName(row: unknown) {
  return row && typeof row === 'object' && typeof (row as { categoryName?: unknown }).categoryName === 'string' ? (row as { categoryName: string }).categoryName : undefined
}

function highRisk(row: unknown) {
  return row && typeof row === 'object' && (row as { isHighRisk?: unknown }).isHighRisk === true
}
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="quality-inspection-work-item-selector">
    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <div class="border-b border-outline-variant px-4 py-3">
        <h3 class="font-semibold">Pilih Item Pekerjaan</h3>
        <p class="mt-1 text-sm text-on-surface-variant">Hanya item pekerjaan aktif dengan data ITP yang dapat dipilih.</p>
      </div>
      <TreeTable
        :data="treeRows"
        :fields="{
          item: { label: 'Item Pekerjaan', read: (row: QualityInspectionTreeNode) => row.name },
          volume: { label: 'Volume', read: (row: QualityInspectionTreeNode) => row.volume ?? '—' },
          uomName: { label: 'Satuan', read: (row: QualityInspectionTreeNode) => row.uomName ?? '—' },
          isHighRisk: { label: 'High Risk', read: (row: QualityInspectionTreeNode) => row.isHighRisk ? 'High Risk' : '—' },
        }"
        :children="children"
        tree-column="item"
        :pagination="false"
        row-key="id"
      >
        <template #tree-cell="{ value, record }">
          <span :class="isCandidate(record) ? 'font-medium' : 'text-on-surface-variant'">
            <span>{{ value }}</span>
            <span v-if="categoryName(record)" class="ml-2 text-sm text-on-surface-variant">{{ categoryName(record) }}</span>
          </span>
        </template>
        <template #cell:isHighRisk="{ record }">
          <Chip v-if="highRisk(record)" color="error">High Risk</Chip>
          <span v-else>—</span>
        </template>
        <template #row-actions="{ record }">
          <Button v-if="isCandidate(record)" type="button" variant="tonal" @click.stop="toggle(record)">
            <template #icon><Icon :name="selectedIds.has(record.id) ? 'close' : 'add'" /></template>
            {{ selectedIds.has(record.id) ? 'Hapus' : 'Pilih' }}
          </Button>
          <Chip v-else color="neutral">Induk</Chip>
        </template>
      </TreeTable>
    </Card>

    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <div class="border-b border-outline-variant px-4 py-3">
        <h3 class="font-semibold">Item Terpilih</h3>
      </div>
      <Table v-if="selectedRows.length" :data="selectedRows" :fields="selectedFields" :pagination="false" row-key="id">
        <template #cell:volume="{ record }"><Form :model-value="record" :fields="volumeFields" @update:model-value="(value) => updateRow(record, value)" /></template>
        <template #cell:types="{ record }"><Form :model-value="record" :fields="fieldsFor(record)" @update:model-value="(value) => updateRow(record, value)" /></template>
        <template #row-actions="{ record }">
          <Button type="button" kind="icon" variant="standard" color="error" :aria-label="`Hapus ${record.name}`" @click="toggle(candidates.find((candidate) => candidate.id === record.id)!)">
            <template #icon><Icon name="delete-bin" /></template>
          </Button>
        </template>
      </Table>
      <p v-else class="p-4 text-sm text-on-surface-variant">Pilih paling sedikit satu item pekerjaan aktif.</p>
    </Card>
  </div>
</template>
