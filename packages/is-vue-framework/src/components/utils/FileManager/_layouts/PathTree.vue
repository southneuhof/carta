<script setup lang="ts">
import { ref } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger, ContextMenuRoot } from 'radix-vue'

interface FolderItem {
  path: string
  // Add other properties that your folder items might have
  [key: string]: any
}

import { toast } from 'vue-sonner'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'

const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
  onDirectoryDeleted: {
    type: Function,
    default: () => {},
  },
  expandedPaths: {
    type: Array as () => string[],
    default: () => [],
  },
  onExpandedChange: {
    type: Function,
    default: () => {},
  },
})

const modelValue = defineModel<Record<string, any>>()

const isExpanded = ref(props.expandedPaths.includes(props.item?.path) || props.level === 0)
const isLoading = ref(false)
const children = ref<FolderItem[]>([])
const isRoot = props.level === 0
const ROOT_STORAGE_PATH = '/storage/public'

function getDisplayLabel(path?: string) {
  return path === ROOT_STORAGE_PATH ? 'Storage' : path?.split('/').pop()
}

function getFolderIcon(path?: string) {
  return path === ROOT_STORAGE_PATH ? 'hard-drive-2' : 'folder'
}

function selectItem(item: Record<string, any>) {
  modelValue.value = { ...item }
}

function setExpandedState(nextValue: boolean) {
  isExpanded.value = nextValue
  props.onExpandedChange(props.item?.path, nextValue)
}

const loadChildren = async (event?: Event) => {
  if (event) {
    event.stopPropagation()
  }
  if (!isExpanded.value && children.value.length === 0) {
    await fetchChildren()
  }
  setExpandedState(!isExpanded.value)
}

async function fetchChildren() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const behavior = getFrameworkBehaviors().fileManager?.listFiles
    if (!behavior) missingBehavior('fileManager.listFiles')
    children.value = (await behavior({ dir: props.item?.path || '', type: 'folder' })) || []
  } catch (error) {
    console.error('Error loading children:', error)
    children.value = []
  } finally {
    isLoading.value = false
  }
}

function deleteFile(path: string) {
  const behavior = getFrameworkBehaviors().fileManager?.deleteFile
  if (!behavior) missingBehavior('fileManager.deleteFile')
  return behavior(path)
}

async function ensureFolderNameAvailable(dir: string, folderName: string) {
  const behavior = getFrameworkBehaviors().fileManager?.listFiles
  if (!behavior) missingBehavior('fileManager.listFiles')

  const existingItems = (await behavior({ dir, limit: 1000 })) || []
  const normalizedFolderName = String(folderName || '').trim()
  const alreadyExists = existingItems.some((item: Record<string, any>) => item?.path?.split('/').pop() === normalizedFolderName)

  if (alreadyExists) {
    toast.error('Folder name already exists')
    throw new Error('Folder name already exists')
  }
}

async function createFolder(payload: Record<string, any>) {
  await ensureFolderNameAvailable(payload.dir, payload.folder_name)
  const behavior = getFrameworkBehaviors().fileManager?.createFolder
  if (!behavior) missingBehavior('fileManager.createFolder')
  return behavior(payload.dir, payload.folder_name)
}

function handleDeleteDirectory(path: string) {
  return deleteFile(path)
    .then(() => {
      toast.success('File deleted successfully')
      props.onDirectoryDeleted(path)
    })
    .catch(() => toast.error('Failed to delete file'))
}

async function handleCreateFolderSuccess() {
  toast.success('Folder created successfully')
  setExpandedState(true)
  await fetchChildren()
}

if (isExpanded.value) {
  await fetchChildren()
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <ContextMenuRoot>
      <ContextMenuTrigger as-child>
        <button
          class="overlay flex w-full min-w-fit flex-row items-center gap-2 rounded-sm px-2 py-0 after:hover:bg-on-info-container/[8%] after:active:bg-on-info-container/[12%]"
          :style="{ 'padding-left': `${level * 16 + 8}px` }"
          @click="() => selectItem(item || { path: '/storage/public' })"
          :class="{ 'bg-info-container': modelValue?.path === item?.path }"
        >
          <div class="flex flex-row items-center">
            <div
              @click="loadChildren"
              class="group/expandIcon z-[10] cursor-default py-2 opacity-100 transition-opacity duration-1000 group-hover/pathTree:opacity-100"
            >
              <Icon :name="isExpanded ? 'arrow-down-s' : 'arrow-right-s'" class="text-muted group-hover/expandIcon:text-on-surface"></Icon>
            </div>
            <Icon :name="getFolderIcon(item?.path)" />
          </div>
          <span class="path-name whitespace-nowrap text-start">{{ getDisplayLabel(item?.path) }}</span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent class="z-10 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
          <ContextMenuItem @select.prevent>
            <DialogForm
              :fields="['folder_name']"
              :fieldsAlias="{ folder_name: 'Nama Folder' }"
              :inputConfig="{
                folder_name: {
                  type: 'text',
                  props: {
                    required: true,
                  },
                },
              }"
              class="w-full"
              :extraData="{ dir: item.path }"
              :onSubmit="({ payload }) => createFolder(payload)"
              :onSuccess="handleCreateFolderSuccess"
            >
              <template #trigger>
                <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10">
                  <Icon name="add"></Icon>
                  <p>Buat Folder Baru</p>
                </div>
              </template>
            </DialogForm>
          </ContextMenuItem>
          <ContextMenuItem v-if="!isRoot" @select.prevent>
            <ConfirmationDialog
              class="w-full"
              :onConfirm="() => handleDeleteDirectory(item.path)"
            >
              <template #trigger>
                <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-error hover:bg-on-surface/10">
                  <Icon name="delete-bin"></Icon>
                  <p>Delete</p>
                </div>
              </template>
            </ConfirmationDialog>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenuRoot>

    <div v-if="isExpanded && children.length > 0" class="flex flex-col gap-0.5">
      <template v-if="isLoading">
        <div class="loading">Loading...</div>
      </template>
      <template v-else>
        <PathTree
          v-for="child in children"
          :key="child.path"
          :item="child"
          :level="level + 1"
          v-model="modelValue"
          :onDirectoryDeleted="props.onDirectoryDeleted"
          :expandedPaths="props.expandedPaths"
          :onExpandedChange="props.onExpandedChange"
        />
      </template>
    </div>
  </div>
</template>
