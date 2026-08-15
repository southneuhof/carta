<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { DialogForm, Form, Table, type FormProps } from '@southneuhof/is-vue-framework'
import { Button, Card, Chip, Icon } from '@southneuhof/is-vue-framework/components/base'
import { divisions } from '../divisions/divisions.resource'
import { projects } from '../projects/projects.resource'
import { workItems } from './work-items.resource'
import type { WorkItemTreeNode } from './work-items.actions'

type WorkItemContext = { divisionId: string | undefined; projectId: string | undefined }
type TreeRow = WorkItemTreeNode & { depth: number }

const context = ref<WorkItemContext>({ divisionId: undefined, projectId: undefined })
const loading = ref(false)
const nodes = ref<WorkItemTreeNode[]>([])
const formOpen = ref(false)
const formMode = ref<'root' | 'child' | 'edit'>('root')
const parentId = ref<string>()
const editId = ref<string>()

const contextFields = {
  divisionId: { label: 'Division', form: { renderer: 'lookup', source: divisions, props: { pick: 'id', view: 'name', required: true } } },
  projectId: { label: 'Project', form: { renderer: 'lookup', source: projects, props: { pick: 'id', view: 'name', required: true }, behavior: { disabled: ({ draft }) => !draft.divisionId, props: ({ draft }) => ({ searchParameters: { divisionId: draft.divisionId } }), resetWhen: ({ draft }) => draft.divisionId } } },
}

const rows = computed<TreeRow[]>(() => {
  const flatten = (items: WorkItemTreeNode[], depth: number): TreeRow[] => items.flatMap((item) => [{ ...item, depth }, ...flatten(item.children, depth + 1)])
  return flatten(nodes.value, 0)
})

const treeFields = {
  name: {},
  categoryName: { label: 'Category' },
  volume: { label: 'Volume' },
  uomName: { label: 'UOM' },
  isHighRisk: { label: 'High Risk' },
  haveMaterialItp: { label: 'Material ITP' },
  haveProcessItp: { label: 'Process ITP' },
  haveProductsItp: { label: 'Products ITP' },
}

function treeRow(record: Record<string, unknown>) {
  return record as unknown as TreeRow
}

function volume(value: unknown) {
  return value == null ? '—' : Number(value).toFixed(2)
}

const form = computed<FormProps>(() => {
  if (formMode.value === 'edit' && editId.value) {
    const record = rows.value.find((row) => row.id === editId.value)
    const action = workItems.update({ id: editId.value, context: { variant: record?.parentId ? 'child' : 'root' } })
    const { run, ...props } = action
    return { ...props, submit: run } as unknown as FormProps
  }
  const action = workItems.create({
    initialData: { projectId: context.value.projectId, ...(formMode.value === 'child' ? { parentId: parentId.value } : {}) },
    context: { variant: formMode.value },
  })
  const { run, ...props } = action
  return { ...props, submit: run } as unknown as FormProps
})

async function loadTree() {
  nodes.value = []
  if (!context.value.projectId) return
  loading.value = true
  try {
    nodes.value = await workItems.actions.loadTree.run(context.value.projectId)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Jenis Pekerjaan could not be loaded.')
  } finally {
    loading.value = false
  }
}

watch(() => context.value.projectId, loadTree)

function addRoot() {
  formMode.value = 'root'
  parentId.value = undefined
  editId.value = undefined
  formOpen.value = true
}

function addChild(row: TreeRow) {
  formMode.value = 'child'
  parentId.value = row.id
  editId.value = undefined
  formOpen.value = true
}

function edit(row: TreeRow) {
  formMode.value = 'edit'
  editId.value = row.id
  parentId.value = row.parentId ?? undefined
  formOpen.value = true
}

async function remove(row: TreeRow) {
  if (!window.confirm('Delete this Jenis Pekerjaan?')) return
  try {
    await workItems.delete({ id: row.id }).run()
    await loadTree()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Jenis Pekerjaan could not be deleted.')
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">Jenis Pekerjaan</h1>
    <Card variant="outlined" color="surfaceContainer" class="p-4">
      <Form v-model="context" :fields="contextFields" />
    </Card>

    <Card v-if="context.projectId" variant="outlined" color="surfaceContainer" class="p-0">
      <div class="flex items-center justify-between border-b border-outline-variant p-4">
        <h2 class="font-semibold">Project Jenis Pekerjaan</h2>
        <Button :disabled="loading" @click="addRoot"><Icon name="add" /> Add Root</Button>
      </div>
      <div v-if="loading" class="p-4">Loading…</div>
      <Table v-else :fields="treeFields" :data="rows" :pagination="false" row-key="id">
        <template #cell:name="{ value, record }">
          <span :style="{ paddingLeft: `${treeRow(record).depth * 1.25}rem` }">{{ value }}</span>
        </template>
        <template #cell:volume="{ value }">{{ volume(value) }}</template>
        <template #cell:isHighRisk="{ value }"><Chip :color="value ? 'error' : 'neutral'">{{ value ? 'High Risk' : 'No' }}</Chip></template>
        <template #cell:haveMaterialItp="{ value }"><Icon v-if="value" name="check" /><span v-else>—</span></template>
        <template #cell:haveProcessItp="{ value }"><Icon v-if="value" name="check" /><span v-else>—</span></template>
        <template #cell:haveProductsItp="{ value }"><Icon v-if="value" name="check" /><span v-else>—</span></template>
        <template #row-actions="{ record }">
          <Button kind="icon" variant="standard" aria-label="Add child" @click="addChild(treeRow(record))">Child</Button>
          <Button kind="icon" variant="standard" aria-label="Edit" @click="edit(treeRow(record))">Edit</Button>
          <Button kind="icon" variant="standard" color="error" aria-label="Delete" @click="remove(treeRow(record))">Delete</Button>
        </template>
      </Table>
    </Card>
    <Card v-else variant="outlined" color="surfaceContainer" class="p-4">Select a project to load Jenis Pekerjaan.</Card>

    <DialogForm v-if="formOpen" :key="`${formMode}-${editId ?? parentId ?? 'new'}`" v-model:open="formOpen" :title="formMode === 'edit' ? 'Edit Jenis Pekerjaan' : formMode === 'child' ? 'Add Child Jenis Pekerjaan' : 'Add Root Jenis Pekerjaan'" v-bind="form" @submitted="loadTree" />
  </section>
</template>
