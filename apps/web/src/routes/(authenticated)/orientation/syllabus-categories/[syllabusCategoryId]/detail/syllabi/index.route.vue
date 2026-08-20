<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { DialogForm, Table } from '@southneuhof/is-vue-framework'
import { Button, Card, Icon } from '@southneuhof/is-vue-framework/components/base'
import { useRoute } from 'vue-router'
import { permissions } from '@/stores/permissions'
import { syllabusLookup } from '../../../syllabus-categories.resource'
import { syllabusCategoryActions } from '../../../syllabus-categories.actions'

type Mapping = { id: string; syllabusId: string; active: boolean; syllabus?: { id: string; name: string } | null }
const route = useRoute('orientation-syllabus-categories-detail-syllabi')
const categoryId = String(route.params.syllabusCategoryId)
const access = permissions()
const rows = ref<Mapping[]>([])
const loading = ref(false)
const formOpen = ref(false)
const canManage = computed(() => access.has('update-syllabus-categories'))
const fields = { name: { label: 'Silabus', read: (row: Mapping) => row.syllabus?.name ?? '—' }, active: { label: 'Status' } }
const addFields = {
  syllabusIds: {
    label: 'Silabus',
    form: {
      renderer: 'lookup',
      source: syllabusLookup,
      props: { pick: 'id', view: 'name', multi: true, required: true },
      behavior: { props: () => ({ searchParameters: { active: true, notInCategoryId: categoryId } }) },
    },
  },
}

async function load() {
  loading.value = true
  try {
    rows.value = (await syllabusCategoryActions.mappings({ categoryId, query: {}, searchParameters: {}, signal: undefined })).data
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Silabus could not be loaded.')
  } finally {
    loading.value = false
  }
}

async function add(input: Record<string, unknown>) {
  const ids = Array.isArray(input.syllabusIds)
    ? input.syllabusIds.map((value) => (typeof value === 'string' ? value : value && typeof value === 'object' && 'id' in value ? String((value as { id: unknown }).id) : '')).filter(Boolean)
    : []
  await syllabusCategoryActions.addMappings(categoryId, ids)
  formOpen.value = false
  toast.success('Silabus berhasil ditambahkan.')
  await load()
}

async function remove(row: Mapping) {
  try {
    await syllabusCategoryActions.removeMapping(categoryId, row.syllabusId)
    toast.success('Silabus berhasil dihapus.')
    await load()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Silabus could not be removed.')
  }
}

onMounted(() => void load())
</script>

<template>
  <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
    <div class="flex items-center justify-between border-b border-outline-variant px-4 py-3">
      <h2 class="font-semibold">Silabus</h2>
      <Button v-if="canManage" type="button" @click="formOpen = true"
        ><template #icon><Icon name="add" /></template>Tambah</Button
      >
    </div>
    <div v-if="loading" class="p-6 text-on-surface-variant" role="status">Loading...</div>
    <Table v-else :data="rows" :fields="fields" :pagination="false" row-key="id">
      <template #cell:active="{ record }">{{ record.active ? 'Aktif' : 'Tidak Aktif' }}</template>
      <template #row-actions="{ record }"
        ><Button v-if="canManage" type="button" kind="icon" variant="standard" color="error" :aria-label="`Hapus ${record.syllabus?.name ?? 'Silabus'}`" @click="remove(record)"
          ><template #icon><Icon name="delete-bin" /></template></Button
      ></template>
    </Table>
    <p v-if="!loading && !rows.length" class="p-6 text-sm text-on-surface-variant">Tidak ada data</p>
  </Card>
  <DialogForm v-if="formOpen" v-model:open="formOpen" title="Tambah Silabus" :fields="addFields" :submit="add as never" />
</template>
