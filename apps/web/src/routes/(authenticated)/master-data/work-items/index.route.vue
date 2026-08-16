<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { DialogForm, Form, type FormProps } from '@southneuhof/is-vue-framework'
import { Button, Card, Chip, Icon } from '@southneuhof/is-vue-framework/components/base'
import { permissions } from '@/stores/permissions'
import { divisions } from '../divisions/divisions.resource'
import { projects } from '../projects/projects.resource'
import { workItems } from './work-items.resource'
import type { WorkItemTreeNode } from './work-items.actions'

type WorkItemContext = { divisionId: string | undefined; projectId: string | undefined }
type TreeLine = { top: boolean; bottom: boolean }
type TreeRow = WorkItemTreeNode & { depth: number; isLast: boolean; lines: TreeLine[] }
type FlatTreeRow = TreeRow & { rowIndex: number; subtreeEnd: number }

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

const rows = computed<TreeRow[]>(() => {
  const flat: FlatTreeRow[] = []
  const flatten = (items: WorkItemTreeNode[], depth = 0) => items.forEach((item, index) => {
    const rowIndex = flat.length
    flat.push({ ...item, depth, isLast: index === items.length - 1, lines: [], rowIndex, subtreeEnd: rowIndex })
    flatten(item.children, depth + 1)
    flat[rowIndex].subtreeEnd = flat.length - 1
  })
  flatten(nodes.value)

  const intervals = flat.map(() => new Set<number>())
  for (const row of flat) {
    const end = Math.min(flat.length - 1, row.subtreeEnd + (row.depth > 0 && !row.isLast ? 1 : 0))
    for (let interval = row.rowIndex; interval < end; interval += 1) intervals[interval].add(row.depth)
  }

  return flat.map((row, index) => ({
    ...row,
    lines: Array.from({ length: row.depth + (row.children.length ? 1 : 0) }, (_, lineIndex) => ({
      top: index > 0 && intervals[index - 1].has(lineIndex),
      bottom: index < flat.length - 1 && intervals[index].has(lineIndex),
    })),
  }))
})

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
      <!-- framework-gap: Table has no tree-group connector layer; this route needs a semantic table with separate root branches. -->
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1120px] border-collapse text-sm text-on-surface">
          <caption class="sr-only">Project Jenis Pekerjaan</caption>
          <thead class="bg-surface-container-high text-on-surface-variant">
            <tr>
              <th scope="col" class="min-w-[18rem] border-b border-outline-variant px-4 py-3 text-start text-xs font-semibold">Work item</th>
              <th scope="col" class="min-w-[10rem] border-b border-outline-variant px-4 py-3 text-start text-xs font-semibold">Category</th>
              <th scope="col" class="min-w-[7rem] border-b border-outline-variant px-4 py-3 text-right text-xs font-semibold">Volume</th>
              <th scope="col" class="min-w-[7rem] border-b border-outline-variant px-4 py-3 text-start text-xs font-semibold">UOM</th>
              <th scope="col" class="min-w-[9rem] border-b border-outline-variant px-4 py-3 text-center text-xs font-semibold">High Risk</th>
              <th scope="col" class="min-w-[9.5rem] border-b border-outline-variant px-4 py-3 text-center text-xs font-semibold">Material ITP</th>
              <th scope="col" class="min-w-[9.5rem] border-b border-outline-variant px-4 py-3 text-center text-xs font-semibold">Process ITP</th>
              <th scope="col" class="min-w-[9.5rem] border-b border-outline-variant px-4 py-3 text-center text-xs font-semibold">Products ITP</th>
              <th scope="col" class="sticky right-0 z-10 min-w-[9.5rem] border-b border-outline-variant bg-surface-container-high px-4 py-3 text-right text-xs font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="group transition-none hover:bg-surface-container-high focus-within:bg-surface-container-high">
              <td class="relative h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0 text-on-surface">
                <div class="flex h-14 min-w-0 items-center">
                  <span v-if="row.depth" class="h-14 w-10 shrink-0" :style="{ width: `${row.depth * 2.5}rem` }" aria-hidden="true" />
                  <span v-if="row.lines.length" class="pointer-events-none absolute inset-y-0 left-4 flex" aria-hidden="true">
                    <span v-for="(line, lineIndex) in row.lines" :key="lineIndex" class="relative h-14 w-10 shrink-0">
                      <span
                        v-if="line.top"
                        class="absolute left-1 w-px bg-outline/[62%]"
                        :class="line.bottom ? 'inset-y-0' : 'top-0 h-1/2'"
                      />
                      <span v-if="lineIndex === row.depth - 1" class="absolute left-1 top-1/2 h-px w-9 bg-outline/[62%]" />
                    </span>
                  </span>
                  <span class="min-w-0 truncate" :class="{ 'font-medium': row.depth === 0 }">{{ row.name }}</span>
                </div>
              </td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0">{{ row.categoryName ?? '-' }}</td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0 text-right tabular-nums">{{ volume(row.volume) }}</td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0">{{ row.uomName ?? '-' }}</td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0 text-center"><Chip :color="row.isHighRisk ? 'error' : 'neutral'">{{ row.isHighRisk ? 'High Risk' : 'No' }}</Chip></td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0 text-center">
                <Icon v-if="row.haveMaterialItp" name="check" size="base" class="text-success" aria-label="Included" />
                <span v-else class="text-on-surface-variant" aria-label="Not included">—</span>
              </td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0 text-center">
                <Icon v-if="row.haveProcessItp" name="check" size="base" class="text-success" aria-label="Included" />
                <span v-else class="text-on-surface-variant" aria-label="Not included">—</span>
              </td>
              <td class="h-14 whitespace-nowrap border-b border-outline/[12%] px-4 py-0 text-center">
                <Icon v-if="row.haveProductsItp" name="check" size="base" class="text-success" aria-label="Included" />
                <span v-else class="text-on-surface-variant" aria-label="Not included">—</span>
              </td>
              <td class="relative sticky right-0 z-10 h-14 min-w-[9.5rem] whitespace-nowrap border-b border-outline/[12%] bg-surface-container px-3 py-0 text-right before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-outline/[12%] before:content-[''] group-hover:bg-surface-container-high group-focus-within:bg-surface-container-high">
                <div class="flex items-center justify-end gap-1">
                  <Button v-if="canCreate" type="button" kind="icon" variant="standard" :aria-label="`Add child to ${row.name}`" @click="addChild(row)">
                    <template #icon><Icon name="add" size="base" /></template>
                  </Button>
                  <Button v-if="canUpdate" type="button" kind="icon" variant="standard" :aria-label="`Edit ${row.name}`" @click="edit(row)">
                    <template #icon><Icon name="edit" size="base" /></template>
                  </Button>
                  <Button v-if="canDelete" type="button" kind="icon" variant="standard" color="error" :aria-label="`Delete ${row.name}`" @click="remove(row)">
                    <template #icon><Icon name="delete-bin" size="base" /></template>
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
    <Card v-else variant="outlined" color="surfaceContainer" class="flex items-center gap-3 p-4 text-on-surface-variant">
      <Icon name="information" aria-hidden="true" />
      <span>Select a project to load Jenis Pekerjaan.</span>
    </Card>

    <DialogForm v-if="formOpen" :key="`${formMode}-${editId ?? parentId ?? 'new'}`" v-model:open="formOpen" :title="formMode === 'edit' ? 'Edit Jenis Pekerjaan' : formMode === 'child' ? 'Add Child Jenis Pekerjaan' : 'Add Root Jenis Pekerjaan'" v-bind="form" @submitted="loadTree" />
  </section>
</template>
