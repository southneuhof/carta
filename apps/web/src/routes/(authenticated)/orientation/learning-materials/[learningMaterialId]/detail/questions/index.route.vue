<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Form, Table } from '@southneuhof/is-vue-framework'
import { Button, Card, Dialog, Icon } from '@southneuhof/is-vue-framework/components/base'
import { useRoute } from 'vue-router'
import { permissions } from '@/stores/permissions'
import { learningMaterialActions } from '../../../learning-materials.actions'
import type { LearningMaterialQuestion, LearningMaterialQuestionInput } from '../../../learning-materials.schema'

const route = useRoute('orientation-learning-materials-detail-questions')
const materialId = String(route.params.learningMaterialId)
const access = permissions()
const rows = ref<LearningMaterialQuestion[]>([])
const loading = ref(false)
const formOpen = ref(false)
const editId = ref<string>()
const model = ref<Record<string, unknown>>({})
const canManage = computed(() => access.has('update-learning-materials'))
const codes = ['A', 'B', 'C', 'D'] as const
const fields = { name: { label: 'Pertanyaan' }, active: { label: 'Status' } }
const formFields = {
  name: { label: 'Pertanyaan', form: { renderer: 'textarea', props: { required: true } } },
  active: { label: 'Status', form: { renderer: 'switch' } },
  ...Object.fromEntries(
    codes.flatMap((code) => [
      [`answer${code}`, { label: `Pilihan Jawaban ${code}`, form: { renderer: 'text', props: { required: true } } }],
      [`correct${code}`, { label: `Jawaban benar ${code}`, form: { renderer: 'switch' } }],
    ])
  ),
}

async function load() {
  loading.value = true
  try {
    rows.value = (await learningMaterialActions.questions({ materialId })).data
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Soal Ujian could not be loaded.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editId.value = undefined
  model.value = {
    active: true,
    ...Object.fromEntries(
      codes.flatMap((code) => [
        [`answer${code}`, ''],
        [`correct${code}`, code === 'A'],
      ])
    ),
  }
  formOpen.value = true
}

function openEdit(row: LearningMaterialQuestion) {
  editId.value = row.id
  model.value = {
    name: row.name,
    active: row.active,
    ...Object.fromEntries(
      codes.flatMap((code) => {
        const answer = row.answers?.find((item) => item.code === code)
        return [
          [`answer${code}`, answer?.name ?? ''],
          [`correct${code}`, answer?.isAnswer === true],
        ]
      })
    ),
  }
  formOpen.value = true
}

function answers(input: Record<string, unknown>) {
  return codes.map((code) => ({ code, name: String(input[`answer${code}`] ?? '').trim(), isAnswer: input[`correct${code}`] === true, active: true }))
}

async function submit(input: Record<string, unknown>) {
  const payload = { name: String(input.name ?? '').trim(), active: input.active !== false, answers: answers(input) } as LearningMaterialQuestionInput
  try {
    if (editId.value) await learningMaterialActions.updateQuestion(materialId, editId.value, payload)
    else await learningMaterialActions.createQuestion(materialId, payload)
    formOpen.value = false
    toast.success('Pertanyaan berhasil disimpan.')
    await load()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Pertanyaan could not be saved.')
    throw error
  }
}

async function remove(row: LearningMaterialQuestion) {
  if (!window.confirm('Hapus pertanyaan ini?')) return
  try {
    await learningMaterialActions.deleteQuestion(materialId, row.id)
    toast.success('Pertanyaan berhasil dihapus.')
    await load()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Pertanyaan could not be removed.')
  }
}

onMounted(() => void load())
</script>

<template>
  <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
    <div class="flex items-center justify-between border-b border-outline-variant px-4 py-3">
      <h2 class="font-semibold">Soal Ujian</h2>
      <Button v-if="canManage" type="button" @click="openCreate"
        ><template #icon><Icon name="add" /></template>Tambah</Button
      >
    </div>
    <div v-if="loading" class="p-6 text-on-surface-variant" role="status">Loading...</div>
    <Table v-else :data="rows" :fields="fields" :pagination="false" row-key="id">
      <template #cell:active="{ record }">{{ record.active ? 'Aktif' : 'Tidak Aktif' }}</template>
      <template #row-actions="{ record }"
        ><div class="flex gap-1">
          <Button v-if="canManage" type="button" kind="icon" variant="standard" aria-label="Edit pertanyaan" @click="openEdit(record)"
            ><template #icon><Icon name="edit" /></template></Button
          ><Button v-if="canManage" type="button" kind="icon" variant="standard" color="error" aria-label="Hapus pertanyaan" @click="remove(record)"
            ><template #icon><Icon name="delete-bin" /></template
          ></Button></div
      ></template>
    </Table>
    <p v-if="!loading && !rows.length" class="p-6 text-sm text-on-surface-variant">Tidak ada data</p>
  </Card>

  <Dialog v-if="formOpen" :model-value="formOpen" @update:model-value="formOpen = $event">
    <template #title>{{ editId ? 'Edit Pertanyaan' : 'Tambah Pertanyaan' }}</template>
    <template #content>
      <Form v-model="model" :fields="formFields" :submit="submit as never">
        <template #actions="{ submit: save, submitting }"><Button type="button" :disabled="submitting" @click="save">Simpan</Button></template>
      </Form>
    </template>
  </Dialog>
</template>
