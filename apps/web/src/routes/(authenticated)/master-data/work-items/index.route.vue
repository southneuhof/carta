<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { DialogForm, Form, TreeTable, type FormProps } from '@southneuhof/is-vue-framework'
import { Button, Card, Chip, Icon } from '@southneuhof/is-vue-framework/components/base'
import { permissions } from '@/stores/permissions'
import { divisions } from '../divisions/divisions.resource'
import { projects } from '../projects/projects.resource'
import { workItems } from './work-items.resource'
import type { WorkItemTreeNode } from './work-items.actions'

type WorkItemContext = { divisionId: string | undefined; projectId: string | undefined }

const context = ref<WorkItemContext>({ divisionId: undefined, projectId: undefined })
const loading = ref(false)
const nodes = ref<WorkItemTreeNode[]>([])
const formOpen = ref(false)
const formMode = ref<'root' | 'child' | 'edit'>('root')
const parentId = ref<string>()
const editId = ref<string>()
const access = permissions()
const canCreate = computed(() => access.has('create-work-items'))
const canUpdate = computed(() => access.has('update-work-items'))
const canDelete = computed(() => access.has('delete-work-items'))

const contextFields = {
  divisionId: { label: 'Division', form: { renderer: 'lookup', span: 6, source: divisions, props: { pick: 'id', view: 'name', required: true } } },
  projectId: { label: 'Project', form: { renderer: 'lookup', span: 6, source: projects, props: { pick: 'id', view: 'name', required: true }, behavior: { disabled: ({ draft }) => !draft.divisionId, props: ({ draft }) => ({ searchParameters: { divisionId: draft.divisionId } }), resetWhen: ({ draft }) => draft.divisionId } } },
}

function volume(value: unknown) {
  return value == null ? '—' : Number(value).toFixed(2)
}

const treeFields = {
  name: { label: 'Work item' },
  categoryName: { label: 'Category' },
  volume: { label: 'Volume', align: 'end' as const, read: (record: WorkItemTreeNode) => volume(record.volume) },
  uomName: { label: 'UOM' },
  isHighRisk: { label: 'High Risk' },
  haveMaterialItp: { label: 'Material ITP' },
  haveProcessItp: { label: 'Process ITP' },
  haveProductsItp: { label: 'Products ITP' },
}

const treeChildren = (record: WorkItemTreeNode) => record.children

function findNode(items: readonly WorkItemTreeNode[], id: string): WorkItemTreeNode | undefined {
  for (const item of items) {
    if (item.id === id) return item
    const nested = findNode(item.children, id)
    if (nested) return nested
  }
}

const form = computed<FormProps>(() => {
  if (formMode.value === 'edit' && editId.value) {
    const record = findNode(nodes.value, editId.value)
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

function addChild(row: WorkItemTreeNode) {
  formMode.value = 'child'
  parentId.value = row.id
  editId.value = undefined
  formOpen.value = true
}

function edit(row: WorkItemTreeNode) {
  formMode.value = 'edit'
  editId.value = row.id
  parentId.value = row.parentId ?? undefined
  formOpen.value = true
}

async function remove(row: WorkItemTreeNode) {
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
  <section class="flex flex-col gap-2">
    <h1 class="text-lg font-semibold leading-6 tracking-tight">Jenis Pekerjaan</h1>
    <Card variant="outlined" color="surfaceContainer" class="p-4 sm:p-5">
      <Form v-model="context" :fields="contextFields" />
    </Card>

    <Card v-if="context.projectId" variant="outlined" color="surfaceContainer" class="p-0">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4 sm:px-6">
        <h2 class="font-semibold">Project Jenis Pekerjaan</h2>
        <Button v-if="canCreate" type="button" :disabled="loading" @click="addRoot">
          <template #icon><Icon name="add" /></template>
          Add Root
        </Button>
      </div>
      <div v-if="loading" class="flex min-h-40 items-center justify-center px-6 py-10 text-on-surface-variant" role="status" aria-live="polite">Loading…</div>
      <TreeTable
        v-else
        :data="nodes"
        :fields="treeFields"
        :children="treeChildren"
        tree-column="name"
        :pagination="false"
        row-key="id"
      >
        <template #tree-cell="{ value, depth }">
          <span :class="{ 'font-medium': depth === 0 }">{{ value }}</span>
        </template>
        <template #cell:isHighRisk="{ value }">
          <Chip :color="value === true ? 'error' : 'neutral'">{{ value === true ? 'High Risk' : 'No' }}</Chip>
        </template>
        <template #cell:haveMaterialItp="{ value }">
          <Icon v-if="value === true" name="check" size="base" class="text-success" aria-label="Included" />
          <span v-else class="text-on-surface-variant" aria-label="Not included">—</span>
        </template>
        <template #cell:haveProcessItp="{ value }">
          <Icon v-if="value === true" name="check" size="base" class="text-success" aria-label="Included" />
          <span v-else class="text-on-surface-variant" aria-label="Not included">—</span>
        </template>
        <template #cell:haveProductsItp="{ value }">
          <Icon v-if="value === true" name="check" size="base" class="text-success" aria-label="Included" />
          <span v-else class="text-on-surface-variant" aria-label="Not included">—</span>
        </template>
        <template #row-actions="{ record }: { record: WorkItemTreeNode }">
          <div class="flex items-center justify-end gap-1">
            <Button v-if="canCreate" type="button" kind="icon" variant="standard" :aria-label="`Add child to ${record.name}`" @click="addChild(record)">
              <template #icon><Icon name="add" size="base" /></template>
            </Button>
            <Button v-if="canUpdate" type="button" kind="icon" variant="standard" :aria-label="`Edit ${record.name}`" @click="edit(record)">
              <template #icon><Icon name="edit" size="base" /></template>
            </Button>
            <Button v-if="canDelete" type="button" kind="icon" variant="standard" color="error" :aria-label="`Delete ${record.name}`" @click="remove(record)">
              <template #icon><Icon name="delete-bin" size="base" /></template>
            </Button>
          </div>
        </template>
      </TreeTable>
    </Card>
    <Card v-else variant="outlined" color="surfaceContainer" class="flex items-center gap-3 p-4 text-on-surface-variant">
      <Icon name="information" aria-hidden="true" />
      <span>Select a project to load Jenis Pekerjaan.</span>
    </Card>

    <DialogForm v-if="formOpen" :key="`${formMode}-${editId ?? parentId ?? 'new'}`" v-model:open="formOpen" :title="formMode === 'edit' ? 'Edit Jenis Pekerjaan' : formMode === 'child' ? 'Add Child Jenis Pekerjaan' : 'Add Root Jenis Pekerjaan'" v-bind="form" @submitted="loadTree" />
  </section>
</template>
