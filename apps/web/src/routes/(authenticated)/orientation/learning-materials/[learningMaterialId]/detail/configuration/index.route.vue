<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { DialogForm, Table } from '@southneuhof/is-vue-framework'
import { Button, Card, Icon } from '@southneuhof/is-vue-framework/components/base'
import { useRoute } from 'vue-router'
import { permissions } from '@/stores/permissions'
import { learningMaterialActions } from '../../../learning-materials.actions'
import type { LearningMaterialAttachment } from '../../../learning-materials.schema'

const route = useRoute('orientation-learning-materials-detail-configuration')
const materialId = String(route.params.learningMaterialId)
const access = permissions()
const rows = ref<LearningMaterialAttachment[]>([])
const loading = ref(false)
const formOpen = ref(false)
const editId = ref<string>()
const canManage = computed(() => access.has('update-learning-materials'))
const fields = { name: { label: 'Nama' }, fileAttachment: { label: 'File' }, description: { label: 'Deskripsi' }, active: { label: 'Status' } }
const formFields = {
  name: { label: 'Nama', form: { renderer: 'text', props: { required: true } } },
  fileAttachment: { label: 'File', form: { renderer: 'file' } },
  description: { label: 'Deskripsi', form: { renderer: 'textarea' } },
  active: { label: 'Status', form: { renderer: 'switch' } },
}

async function load() {
  loading.value = true
  try {
    rows.value = (await learningMaterialActions.attachments({ materialId, query: {}, searchParameters: {}, signal: undefined })).data
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Attachment could not be loaded.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editId.value = undefined
  formOpen.value = true
}
function openEdit(row: LearningMaterialAttachment) {
  editId.value = row.id
  formOpen.value = true
}
function initialData() {
  return editId.value ? rows.value.find((row) => row.id === editId.value) : { active: true }
}

async function submit(input: Record<string, unknown>) {
  if (editId.value) await learningMaterialActions.updateAttachment(materialId, editId.value, input)
  else await learningMaterialActions.createAttachment(materialId, input)
  formOpen.value = false
  toast.success('Attachment berhasil disimpan.')
  await load()
}

async function remove(row: LearningMaterialAttachment) {
  try {
    await learningMaterialActions.deleteAttachment(materialId, row.id)
    toast.success('Attachment berhasil dihapus.')
    await load()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Attachment could not be removed.')
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card variant="outlined" color="surfaceContainer" class="gap-4 p-4">
      <h2 class="font-semibold">Konfigurasi Ujian</h2>
      <p class="text-sm text-on-surface-variant">Gunakan tab Soal Ujian untuk mengatur pertanyaan dan pilihan jawaban materi.</p>
    </Card>
    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <div class="flex items-center justify-between border-b border-outline-variant px-4 py-3">
        <h2 class="font-semibold">Attachment</h2>
        <Button v-if="canManage" type="button" @click="openCreate"
          ><template #icon><Icon name="add" /></template>Tambah</Button
        >
      </div>
      <div v-if="loading" class="p-6 text-on-surface-variant" role="status">Loading...</div>
      <Table v-else :data="rows" :fields="fields" :pagination="false" row-key="id">
        <template #cell:active="{ record }">{{ record.active ? 'Aktif' : 'Tidak Aktif' }}</template>
        <template #row-actions="{ record }"
          ><div class="flex gap-1">
            <Button v-if="canManage" type="button" kind="icon" variant="standard" aria-label="Edit attachment" @click="openEdit(record)"
              ><template #icon><Icon name="edit" /></template></Button
            ><Button v-if="canManage" type="button" kind="icon" variant="standard" color="error" aria-label="Hapus attachment" @click="remove(record)"
              ><template #icon><Icon name="delete-bin" /></template
            ></Button></div
        ></template>
      </Table>
      <p v-if="!loading && !rows.length" class="p-6 text-sm text-on-surface-variant">Tidak ada data</p>
    </Card>
  </div>
  <DialogForm
    v-if="formOpen"
    :key="editId ?? 'new'"
    v-model:open="formOpen"
    :title="editId ? 'Edit Attachment' : 'Tambah Attachment'"
    :fields="formFields"
    :initial-data="initialData()"
    :submit="submit as never"
  />
</template>
