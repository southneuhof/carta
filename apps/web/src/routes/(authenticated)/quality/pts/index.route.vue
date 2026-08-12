<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { ListView } from '@southneuhof/is-vue-framework'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import PtsCardGrid from './PtsCardGrid.vue'
import { pts, ptsCreateOptionResources } from './pts.resource'

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
  { id: 'on-progress', label: 'On progress' },
  { id: 'close', label: 'Close' },
]
const filters = {
  fields: {
    startMonth: { label: 'Start month', form: { renderer: 'month' } },
    endMonth: { label: 'End month', form: { renderer: 'month' } },
    rootCauseId: { label: 'Root cause', form: { renderer: 'lookup', source: ptsCreateOptionResources.rootCauseCreateOptions, props: { pick: 'id', view: 'name' } } },
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
  <ListView v-bind="pts.list()" title="Manual PTS" :query="query" :filters="filters" :presentation="view === 'grid' ? 'custom' : 'table'" @update:query="query = $event">
    <template #filters>
      <ChipFilter v-model="status" :items="statusItems" @update:model-value="setStatus" />
    </template>
    <template #controls>
      <div class="flex gap-1">
        <Button type="button" :variant="view === 'table' ? 'tonal' : 'standard'" aria-label="Table view" @click="view = 'table'">Table</Button>
        <Button type="button" :variant="view === 'grid' ? 'tonal' : 'standard'" aria-label="Grid view" @click="view = 'grid'">Cards</Button>
      </div>
    </template>
    <template #custom="collection">
      <PtsCardGrid :records="collection.records" @delete="openDelete" />
      <p v-if="collection.loading" class="p-4 text-center" role="status">Loading…</p>
      <p v-else-if="collection.error" class="p-4 text-center text-error" role="alert">{{ collection.error.message }}</p>
    </template>
    <template #row-actions="{ record }">
      <Button v-if="canDelete(record)" type="button" kind="icon" variant="standard" color="error" aria-label="Delete" @click.stop="openDelete(String(record.id))">Delete</Button>
    </template>
  </ListView>
  <DialogForm
    :open="deleteOpen"
    title="Delete PTS"
    :fields="deleteFields as never"
    :initial-data="{ deletedReason: '' }"
    :submit="submitDelete"
    @update:open="(open) => { deleteOpen = open; if (!open) deleteId = undefined }"
  />
</template>
