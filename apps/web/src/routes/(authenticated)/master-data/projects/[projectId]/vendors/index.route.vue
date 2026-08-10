<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { DialogForm, fromZod, ListView } from '@southneuhof/is-vue-framework'
import { Button } from '@southneuhof/is-vue-framework/components/base'
import { projectVendor } from '@southneuhof/api/routes/project-vendors/project-vendors.entity'
import { projectVendors } from '../../../project-vendors/project-vendors.resource'
import { projectVendorOperations, type ProjectVendorCreate, type ProjectVendorUpdate } from '../../../project-vendors/project-vendors.operations'

const route = useRoute()
const projectId = computed(() => String((route.params as Record<string, string>).projectId))
const table = computed(() => projectVendors.table({ searchParameters: { projectId: projectId.value } }).table)
const open = ref(false)
const editId = ref<string>()

const createSchema = fromZod(projectVendor.schemas.create.omit({ projectId: true }))
const updateSchema = fromZod(projectVendor.schemas.update.omit({ projectId: true }))

const form = computed(() => {
  if (editId.value) {
    const base = projectVendors.form({ id: editId.value, context: { scope: 'project' } })
    return {
      ...base,
      schema: updateSchema,
      submit: (draft: ProjectVendorUpdate) => projectVendorOperations.update(editId.value!, { ...draft, projectId: projectId.value }),
    }
  }
  const base = projectVendors.form({ initialData: { projectId: projectId.value }, context: { scope: 'project' } })
  return {
    ...base,
    schema: createSchema,
    submit: (draft: ProjectVendorCreate) => projectVendorOperations.create({ ...draft, projectId: projectId.value }),
  }
})

function createVendor() {
  editId.value = undefined
  open.value = true
}

function editVendor(id: string) {
  editId.value = id
  open.value = true
}

async function refreshed() {
  await projectVendors.invalidate()
}

async function deleteVendor(id: string) {
  if (!window.confirm('Delete this vendor?')) return
  await projectVendors.delete(id)
}
</script>

<template>
  <ListView title="Vendor/Subkon/Mandor" :table="table">
    <template #controls>
      <Button @click="createVendor">Add Vendor</Button>
    </template>
    <template #row-actions="{ record }">
      <Button kind="icon" variant="standard" aria-label="Edit" @click="editVendor(String(record.id))">Edit</Button>
      <Button kind="icon" variant="standard" color="error" aria-label="Delete" @click="deleteVendor(String(record.id))">Delete</Button>
    </template>
  </ListView>

  <DialogForm
    v-if="open"
    :key="`${editId ?? 'create'}-${projectId}`"
    v-model:open="open"
    :title="editId ? 'Edit Vendor' : 'Add Vendor'"
    v-bind="form"
    @submitted="refreshed"
  />
</template>
