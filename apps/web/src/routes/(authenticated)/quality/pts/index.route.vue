<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { ListView } from '@southneuhof/is-vue-framework'
import { Button, Icon } from '@southneuhof/is-vue-framework/components/base'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import PtsCardGrid from './PtsCardGrid.vue'
import { rootCauses } from '@/routes/(authenticated)/master-data/root-causes/root-causes.resource'
import { pts } from './pts.resource'

type View = 'table' | 'grid'
type Status = 'all' | 'open' | 'on-progress' | 'close'

const query = ref<Record<string, unknown>>({})
const view = ref<View>('table')
const status = ref<Status>('all')
const deleteId = ref<string>()
const deleteOpen = ref(false)
const statusItems = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'on-progress', label: 'In progress' },
  { id: 'close', label: 'Closed' },
]
const filters = {
  fields: {
    startMonth: { label: 'Start month', form: { renderer: 'month' } },
    endMonth: { label: 'End month', form: { renderer: 'month' } },
    rootCauseId: { label: 'Root cause', form: { renderer: 'lookup', source: rootCauses, props: { pick: 'id', view: 'name' } } },
  },
}
const deleteFields = {
  deletedReason: { label: 'Delete reason', form: { renderer: 'textarea', props: { required: true } } },
}

function setStatus(value: unknown) {
  const next: Record<string, unknown> = { ...query.value, page: 1 }
  delete next.statusCode
  if (typeof value === 'string' && value !== 'all') next.statusCode = value
  status.value = value === 'open' || value === 'on-progress' || value === 'close' ? value : 'all'
  query.value = next
}

function openDelete(id: string) {
  deleteId.value = id
  deleteOpen.value = true
}

function canDelete(record: Record<string, unknown>) {
  return Array.isArray(record.allowedOperations) && record.allowedOperations.includes('delete')
}

async function submitDelete(input: Record<string, unknown>) {
  const id = deleteId.value
  if (!id) throw new Error('No PTS report selected.')
  try {
    await pts.actions.deleteReport.run(id, String(input.deletedReason ?? ''))
    await pts.invalidate({ id })
    deleteOpen.value = false
    deleteId.value = undefined
    toast.success('PTS deleted.')
    return input
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'PTS delete failed.')
    throw error
  }
}
</script>

<template>
  <ListView v-bind="pts.list()" title="PTS" :query="query" :filters="filters" :presentation="view === 'grid' ? 'custom' : 'table'" @update:query="query = $event">
    <template #header>
      <div class="flex min-w-0 flex-wrap items-center gap-3">
        <h1 class="text-lg font-semibold tracking-tight text-on-surface">PTS</h1>
        <div class="flex items-center gap-1 rounded-full bg-surface-container-low p-1">
          <Button type="button" :variant="view === 'table' ? 'tonal' : 'text'" :aria-pressed="view === 'table'" aria-label="Table view" @click="view = 'table'">
            <template #icon><Icon name="table" /></template>
            Table
          </Button>
          <Button type="button" :variant="view === 'grid' ? 'tonal' : 'text'" :aria-pressed="view === 'grid'" aria-label="Cards view" @click="view = 'grid'">
            <template #icon><Icon name="layout-grid" /></template>
            Cards
          </Button>
        </div>
      </div>
    </template>
    <template #filters>
      <ChipFilter v-model="status" :items="statusItems" @update:model-value="setStatus" />
    </template>
    <template #custom="collection">
      <PtsCardGrid :records="collection.records" @delete="openDelete" />
      <p v-if="collection.loading" class="p-4 text-center" role="status">Loading…</p>
      <p v-else-if="collection.error" class="p-4 text-center text-error" role="alert">{{ collection.error.message }}</p>
    </template>
    <template #row-actions="{ record }">
      <Button v-if="canDelete(record)" type="button" kind="icon" variant="standard" color="error" aria-label="Delete" @click.stop="openDelete(String(record.id))">
        <template #icon><Icon name="delete-bin" size="base" /></template>
      </Button>
    </template>
  </ListView>
  <DialogForm
    :open="deleteOpen"
    title="Delete PTS"
    :fields="deleteFields as never"
    :initial-data="{ deletedReason: '' }"
    :submit="submitDelete"
    @update:open="
      (open) => {
        deleteOpen = open
        if (!open) deleteId = undefined
      }
    "
  />
</template>
