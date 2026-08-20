<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { DialogForm, TreeTable, type FormProps } from '@southneuhof/is-vue-framework'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import ConfirmationDialog, { type ConfirmationDialogActions } from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import { Button, Card, Chip, Icon } from '@southneuhof/is-vue-framework/components/base'
import { permissions } from '@/stores/permissions'
import { lawReferenceItems } from './law-reference-items.resource'
import type { LawReferenceTreeNode } from './law-reference-items.actions'

type FormMode = 'root' | 'child' | 'edit'

const access = permissions()
const canCreate = computed(() => access.has('create-law-reference-items'))
const canUpdate = computed(() => access.has('update-law-reference-items'))
const canDelete = computed(() => access.has('delete-law-reference-items'))
const selectedCategory = ref<string | null>('environment')
const categories = ref<Array<{ id: string; name: string; code: string; active: boolean }>>([])
const nodes = ref<LawReferenceTreeNode[]>([])
const loading = ref(false)
const formOpen = ref(false)
const formMode = ref<FormMode>('root')
const parentId = ref<string>()
const editId = ref<string>()
const deleteTarget = ref<LawReferenceTreeNode | null>(null)

const categoryItems = computed(() => categories.value.map((category) => ({ id: category.code, label: category.name })))

const treeFields = {
  name: { label: 'Nama' },
  type: { label: 'Tipe', read: (row: LawReferenceTreeNode) => (row.level === 1 ? typeLabel(row.type) : '') },
  active: { label: 'Status' },
}

const treeChildren = (row: LawReferenceTreeNode) => row.children

function typeLabel(value: string | null) {
  return value === 'reference' ? 'Reference' : value === 'applicable' ? 'Applicable' : ''
}

function findNode(items: readonly LawReferenceTreeNode[], id: string): LawReferenceTreeNode | undefined {
  for (const item of items) {
    if (item.id === id) return item
    const nested = findNode(item.children, id)
    if (nested) return nested
  }
}

const form = computed<FormProps>(() => {
  if (formMode.value === 'edit' && editId.value) {
    const record = findNode(nodes.value, editId.value)
    const action = lawReferenceItems.update({ id: editId.value, context: { variant: record?.parentId ? 'child' : 'root' } })
    const { run, ...props } = action
    return { ...props, submit: run } as unknown as FormProps
  }
  const action = lawReferenceItems.create({
    initialData: { lawReferenceCategoryCode: selectedCategory.value ?? undefined, ...(formMode.value === 'child' ? { parentId: parentId.value } : {}) },
    context: { variant: formMode.value },
  })
  const { run, ...props } = action
  return { ...props, submit: run } as unknown as FormProps
})

async function loadTree(code = selectedCategory.value ?? 'environment') {
  loading.value = true
  try {
    const result = await lawReferenceItems.actions.loadTree.run(code)
    categories.value = result.categories
    nodes.value = result.items
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Law reference items could not be loaded.')
  } finally {
    loading.value = false
  }
}

function setCategory(value: unknown) {
  if (typeof value !== 'string' || !categories.value.some((category) => category.code === value)) return
  selectedCategory.value = value
}

function addRoot() {
  formMode.value = 'root'
  parentId.value = undefined
  editId.value = undefined
  formOpen.value = true
}

function addChild(row: LawReferenceTreeNode) {
  if (row.level >= 3) return
  formMode.value = 'child'
  parentId.value = row.id
  editId.value = undefined
  formOpen.value = true
}

function edit(row: LawReferenceTreeNode) {
  formMode.value = 'edit'
  editId.value = row.id
  parentId.value = row.parentId ?? undefined
  formOpen.value = true
}

function remove(row: LawReferenceTreeNode) {
  deleteTarget.value = row
}

async function confirmRemove(setOpen: (open: boolean) => void) {
  const row = deleteTarget.value
  if (!row) return setOpen(false)
  await lawReferenceItems.delete({ id: row.id }).run()
  toast.success('Berhasil menghapus data!')
  deleteTarget.value = null
  await loadTree()
  setOpen(false)
}

function deleteError(error: unknown) {
  toast.error(error instanceof Error ? error.message : 'Law reference item could not be deleted.')
}

const confirmationActions: ConfirmationDialogActions[] = [
  { label: 'Lanjut', appearance: { color: 'primary', variant: 'filled' }, onClick: confirmRemove, onError: deleteError },
  {
    label: 'Batal',
    appearance: { color: 'error', variant: 'filled' },
    onClick: (setOpen) => {
      deleteTarget.value = null
      setOpen(false)
    },
  },
]

async function submitted() {
  toast.success('Berhasil mengubah data!')
  await loadTree()
}

watch(selectedCategory, (value, previous) => {
  if (value && value !== previous) void loadTree(value)
})

onMounted(() => void loadTree())
</script>

<template>
  <section class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">Master Regulasi &amp; Perundangan HSSE</h1>
    <Card color="primaryContainer" class="flex flex-row items-start gap-4">
      <Icon name="information" />
      <ul>
        <li>Pada setiap item Undang-Undang, dapat ditambahkan hingga 2 level kedalaman</li>
        <li>Level item yang digunakan untuk pengisian pemenuhan regulasi adalah level 3. Pastikan setiap item terisi hingga 3 level.</li>
      </ul>
    </Card>

    <ChipFilter v-model="selectedCategory" :items="categoryItems" @update:model-value="setCategory" />

    <Card variant="outlined" color="surfaceContainer" class="p-0">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4 sm:px-6">
        <h2 class="font-semibold">Undang-Undang</h2>
        <Button v-if="canCreate" type="button" :disabled="loading" @click="addRoot">
          <template #icon><Icon name="add" /></template>
          Tambah
        </Button>
      </div>
      <div v-if="loading" class="flex min-h-40 items-center justify-center px-6 py-10 text-on-surface-variant" role="status" aria-live="polite">Loading...</div>
      <div v-else-if="!nodes.length" class="px-6 py-10 text-on-surface-variant">Tidak ada data</div>
      <TreeTable v-else :data="nodes" :fields="treeFields" :children="treeChildren" tree-column="name" :pagination="false" row-key="id">
        <template #cell:type="{ value }">
          <span>{{ value }}</span>
        </template>
        <template #cell:active="{ value }">
          <Chip :color="value === true ? 'success' : 'neutral'">{{ value === true ? 'Berlaku' : 'Tidak Berlaku' }}</Chip>
        </template>
        <template #row-actions="{ record }: { record: LawReferenceTreeNode }">
          <div class="flex items-center justify-end gap-1">
            <Button v-if="canCreate && record.level < 3" type="button" kind="icon" variant="standard" :aria-label="`Tambah anak ${record.name}`" @click="addChild(record)">
              <template #icon><Icon name="add" size="base" /></template>
            </Button>
            <Button v-if="canUpdate" type="button" kind="icon" variant="standard" :aria-label="`Edit ${record.name}`" @click="edit(record)">
              <template #icon><Icon name="edit" size="base" /></template>
            </Button>
            <ConfirmationDialog v-if="canDelete" title="Apakah anda yakin ingin melakukan aksi ini?" message="Tekan lanjut untuk melanjutkan aksi" :actions="confirmationActions">
              <template #trigger>
                <Button type="button" kind="icon" variant="standard" color="error" :aria-label="`Hapus ${record.name}`" @click="remove(record)">
                  <template #icon><Icon name="delete-bin" size="base" /></template>
                </Button>
              </template>
            </ConfirmationDialog>
          </div>
        </template>
      </TreeTable>
    </Card>

    <DialogForm v-if="formOpen" :key="`${formMode}-${editId ?? parentId ?? 'new'}`" v-model:open="formOpen" :title="formMode === 'edit' ? 'Edit' : 'Tambah'" v-bind="form" @submitted="submitted" />
  </section>
</template>
