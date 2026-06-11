<script setup lang="ts">
import { parse } from '@southneuhof/utilities/parse'
import { ref, watch } from 'vue'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { useDropZone } from '@vueuse/core'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger, ContextMenuRoot } from 'radix-vue'
import { toast } from 'vue-sonner'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  onSelectFile: {
    type: Function,
    required: true,
  },
  activeObject: {
    type: Object,
    default: () => null,
  },
  onDirectoryDeleted: {
    type: Function,
    default: () => {},
  },
  onNavigateBack: {
    type: Function,
    default: () => {},
  },
  onNavigateForward: {
    type: Function,
    default: () => {},
  },
  canNavigateBack: {
    type: Boolean,
    default: false,
  },
  canNavigateForward: {
    type: Boolean,
    default: false,
  },
})

const data = ref()
const modelValue = defineModel<any>()
const searchParameters = ref({ dir: modelValue.value?.path, sort_by: 'updated_at', sort: 'desc', limit: 1000 })
const dropZoneRef = ref<HTMLElement>()
const VIEW_MODE_STORAGE_KEY = 'fileManager.viewMode'
const viewMode = ref<'list' | 'thumbnail'>(getInitialViewMode())
const viewModePopoverOpen = ref(false)
const brokenPreviewPaths = ref<Set<string>>(new Set())

const columns = ref([
  { label: 'Name', key: 'name', width: 'auto' },
  { label: 'Updated At', key: 'updated_at', width: '200px' },
])
const ROOT_VISIBLE_SEGMENTS = ['storage', 'public']
const ROOT_STORAGE_PATH = '/storage/public'

async function getData() {
  const behavior = getFrameworkBehaviors().fileManager?.listFiles
  if (!behavior) missingBehavior('fileManager.listFiles')
  const responseData = await behavior(searchParameters.value)

  if (Array.isArray(responseData) && responseData.length > 0 && typeof responseData[0] === 'object' && responseData[0] !== null && '0' in responseData[0]) {
    data.value = responseData.map((item: any) => item[Object.keys(item)[0]])
  } else {
    data.value = responseData
  }
}

watch(searchParameters, getData, { deep: true })

function getInitialViewMode(): 'list' | 'thumbnail' {
  if (typeof window === 'undefined') return 'thumbnail'
  const savedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  return savedMode === 'list' || savedMode === 'thumbnail' ? savedMode : 'thumbnail'
}

function setViewMode(mode: 'list' | 'thumbnail') {
  viewMode.value = mode
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  }
}

function isImageItem(item: Record<string, any>) {
  if (String(item?.type || '').toLowerCase() === 'folder') return false
  const mime = String(item?.mime_type || item?.mimeType || '').toLowerCase()
  if (mime.startsWith('image/')) return true

  const source = String(item?.url || item?.path || '')
  return /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?.*)?$/i.test(source)
}

function hasPreview(item: Record<string, any>) {
  const path = String(item?.path || '')
  return Boolean(item?.url) && isImageItem(item) && !brokenPreviewPaths.value.has(path)
}

function onPreviewError(path?: string) {
  if (!path) return
  brokenPreviewPaths.value = new Set([...brokenPreviewPaths.value, path])
}

function sort(columnKey: string) {
  if (searchParameters.value.sort_by === columnKey) {
    searchParameters.value.sort = searchParameters.value.sort === 'asc' ? 'desc' : 'asc'
  } else {
    searchParameters.value.sort_by = columnKey
    searchParameters.value.sort = 'asc'
  }
}

const tableRef = ref<HTMLTableElement | null>(null)
const selectedObject = ref<any>(props.activeObject)

function handleRowClick(item: any) {
  if (item.type === 'folder') {
    modelValue.value = item
  }
  selectedObject.value = item
  props.onSelectFile(item)
}

async function onDrop(files: File[] | null) {
  if (files && files.length > 0) {
    const uploadFile = getFrameworkBehaviors().fileManager?.uploadFile
    if (!uploadFile) missingBehavior('fileManager.uploadFile')
    const uploadPromises = files.map((file) => uploadFile(file, modelValue.value?.path))

    toast.promise(Promise.all(uploadPromises), {
      loading: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`,
      success: () => {
        getData()
        return `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`
      },
      error: `Failed to upload ${files.length > 1 ? 'files' : 'file'}`,
    })
  }
}

const { isOverDropZone } = useDropZone(dropZoneRef as any, onDrop)

await getData()

const _window = window

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

function handleDeleteItem(item: Record<string, any>) {
  return deleteFile(item.path)
    .then(() => {
      toast.success('File deleted successfully')

      if (selectedObject.value?.path === item.path) {
        selectedObject.value = null
      }

      getData()

      if (item.type === 'folder') {
        props.onDirectoryDeleted(item.path)
      }
    })
    .catch(() => toast.error('Failed to delete file'))
}

function navigateToPath(path: string) {
  modelValue.value = {
    ...modelValue.value,
    path,
  }
}

function getVisiblePathSegments(path?: string) {
  const segments = String(path || '')
    .split('/')
    .filter(Boolean)
  const rootIndex = segments.findIndex((segment, index) => ROOT_VISIBLE_SEGMENTS[index] !== undefined && segment === ROOT_VISIBLE_SEGMENTS[index])

  if (rootIndex !== 0 || segments.length < ROOT_VISIBLE_SEGMENTS.length) {
    return segments
  }

  return segments.slice(ROOT_VISIBLE_SEGMENTS.length - 1)
}

function buildVisiblePath(index: number) {
  const visibleSegments = getVisiblePathSegments(modelValue.value?.path)
  return `/${['storage', ...visibleSegments.slice(0, index + 1)].join('/')}`
}

function getDisplayPathName(path?: string) {
  return path === ROOT_STORAGE_PATH ? 'Storage' : path?.split('/').pop()
}

function getBreadcrumbLabel(segment: string, index: number) {
  return index === 0 && segment === 'public' ? 'Storage' : segment
}

watch(
  () => modelValue.value?.path,
  () => {
    brokenPreviewPaths.value = new Set()
  }
)
</script>

<template>
  <ContextMenuRoot class="h-full">
    <ContextMenuTrigger class="h-full">
      <div ref="dropZoneRef" class="relative flex h-full flex-col">
        <div v-if="isOverDropZone" class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10">
          <p class="font-semibold text-primary">Drop files to upload</p> 
        </div>
        <div class="p-4 border-b border-outline-variant">
          <div class="flex flex-row items-center justify-between gap-4">
            <div class="flex min-w-0 flex-row items-center gap-3">
              <div class="flex items-center rounded-full border border-outline-variant bg-surface-container-high px-1 py-1">
                <Button kind="icon" variant="standard" aria-label="Go back" :disabled="!props.canNavigateBack" @click="() => props.onNavigateBack()">
                  <template #icon>
                    <Icon name="arrow-left-s" :class="props.canNavigateBack ? 'text-on-surface' : 'text-muted'"></Icon>
                  </template>
                </Button>
                <div class="mx-1 h-6 w-px bg-outline-variant"></div>
                <Button kind="icon" variant="standard" aria-label="Go forward" :disabled="!props.canNavigateForward" @click="() => props.onNavigateForward()">
                  <template #icon>
                    <Icon name="arrow-right-s" :class="props.canNavigateForward ? 'text-on-surface' : 'text-muted'"></Icon>
                  </template>
                </Button>
              </div>
              <div class="min-w-0">
                <div class="flex flex-row items-center gap-1">
                  <p class="text-xl font-semibold">{{ getDisplayPathName(modelValue?.path) }}</p>
                  <!-- <Button
                    kind="icon"
                    variant="standard"
                    aria-label="Refresh files"
                    class="!p-1"
                    @click="
                      () => {
                        getData()
                      }
                    "
                  >
                    <template #icon>
                      <Icon name="refresh" size="md" class="text-on-surface"></Icon>
                    </template>
                  </Button> -->
                </div>
              </div>
            </div>
            <Popover v-model="viewModePopoverOpen" align="end">
              <template #trigger>
                <div class="ml-2">
                  <Button kind="icon" variant="standard" aria-label="View mode menu">
                    <template #icon>
                      <Icon :name="viewMode === 'list' ? 'file-list' : 'image'" class="text-on-surface"></Icon>
                    </template>
                  </Button>
                </div>
              </template>
              <template #content="{ setOpen }">
                <div class="min-w-[180px] rounded-md border border-outline-variant bg-surface-container-high p-1">
                  <button
                    class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-on-surface/10"
                    data-testid="view-mode-list"
                    @click="
                      () => {
                        setViewMode('list')
                        setOpen(false)
                      }
                    "
                  >
                    <Icon name="file-list" class="text-on-surface"></Icon>
                    <span>List view</span>
                  </button>
                  <button
                    class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-on-surface/10"
                    data-testid="view-mode-thumbnail"
                    @click="
                      () => {
                        setViewMode('thumbnail')
                        setOpen(false)
                      }
                    "
                  >
                    <Icon name="image" class="text-on-surface"></Icon>
                    <span>Thumbnail view</span>
                  </button>
                </div>
              </template>
            </Popover>
          </div>
        </div>
        <div class="border-b border-outline-variant bg-surface-container-high px-4 py-2">
          <div class="flex flex-row flex-wrap items-center gap-1" data-testid="file-manager-breadcrumbs">
            <template v-for="(segment, index) in getVisiblePathSegments(modelValue?.path)" :key="index">
              <button
                v-if="Number(index) != getVisiblePathSegments(modelValue?.path).length - 1"
                class="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-on-surface/10 hover:text-on-surface"
                @click="() => navigateToPath(buildVisiblePath(Number(index)))"
              >
                {{ getBreadcrumbLabel(segment, Number(index)) }}
              </button>
              <span v-else class="rounded-md bg-on-surface/[6%] px-2 py-1 text-sm text-on-surface">{{ getBreadcrumbLabel(segment, Number(index)) }}</span>
              <Icon v-if="Number(index) < getVisiblePathSegments(modelValue?.path).length - 1" name="arrow-right-s" size="sm" class="text-muted"></Icon>
            </template>
          </div>
        </div>
        <div
          class="h-full overflow-auto"
          @mousedown.self="
            (e) => {
              if (e.button === 0) selectedObject = null
            }
          "
        >
          <table v-if="viewMode === 'list'" ref="tableRef" class="w-full table-fixed border-collapse" data-testid="file-list-table" v-columns-resizable>
            <thead>
              <tr>
                <th
                  v-for="(column, index) in columns"
                  :key="column.key"
                  @click="() => sort(column.key)"
                  :style="{ width: column.width, 'min-width': column.width }"
                  class="relative box-border cursor-pointer select-none border-b-[1px] border-b-outline-variant p-2 text-start font-normal text-muted"
                >
                  <div class="flex flex-row items-center gap-1">
                    <p>{{ column.label }}</p>
                    <Icon v-if="searchParameters.sort_by === column.key" :name="searchParameters.sort === 'asc' ? 'arrow-up-s' : 'arrow-down-s'" class="text-muted"></Icon>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <ContextMenuRoot v-for="item in data" :key="item.path">
                <ContextMenuTrigger as-child>
                  <tr
                    @click="handleRowClick(item)"
                    class="relative cursor-pointer hover:bg-on-surface/[8%]"
                    :class="{ 'bg-on-surface/[8%] hover:bg-on-surface/[16%]': item.path === selectedObject?.path }"
                  >
                    <td class="p-2">
                      <div class="flex flex-row items-center gap-2">
                        <Icon :name="item.type === 'folder' ? 'folder' : 'file'"></Icon>
                        {{ item.path.split('/').pop() }}
                      </div>
                    </td>
                    <td class="p-2">{{ parse('datetime', item.updated_at) }}</td>
                  </tr>
                </ContextMenuTrigger>
                <ContextMenuPortal>
                  <Transition name="fade">
                    <ContextMenuContent class="z-10 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
                      <ContextMenuItem class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10" @select.prevent @click="() => _window.open(item.url || item.path, '_blank')">
                        <Icon name="arrow-right-up"></Icon>
                        <p>Open</p>
                      </ContextMenuItem>
                      <ContextMenuItem @select.prevent>
                        <ConfirmationDialog
                          class="w-full"
                          :onConfirm="() => handleDeleteItem(item)"
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
                  </Transition>
                </ContextMenuPortal>
              </ContextMenuRoot>
            </tbody>
          </table>
          <div v-else class="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" data-testid="file-thumbnail-grid">
            <ContextMenuRoot v-for="item in data" :key="item.path">
              <ContextMenuTrigger as-child>
                <button
                  type="button"
                  class="flex w-full flex-col overflow-hidden rounded-md border border-outline-variant bg-surface-container-high text-start transition-colors hover:bg-on-surface/[8%]"
                  :class="{ 'ring-1 ring-outline': item.path === selectedObject?.path }"
                  @click="handleRowClick(item)"
                >
                  <div class="flex aspect-square w-full items-center justify-center bg-surface-container">
                    <img
                      v-if="hasPreview(item)"
                      :src="item.url"
                      :alt="item.path.split('/').pop()"
                      class="h-full w-full object-cover"
                      @error="() => onPreviewError(item.path)"
                    />
                    <Icon v-else :name="item.type === 'folder' ? 'folder' : 'file'" size="6xl" class="text-muted" />
                  </div>
                  <div class="flex w-full flex-col gap-1 p-2">
                    <p class="line-clamp-2 break-all text-sm">{{ item.path.split('/').pop() }}</p>
                    <p class="text-xs text-muted">{{ parse('datetime', item.updated_at) }}</p>
                  </div>
                </button>
              </ContextMenuTrigger>
              <ContextMenuPortal>
                <Transition name="fade">
                  <ContextMenuContent class="z-10 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
                    <ContextMenuItem class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10" @select.prevent @click="() => _window.open(item.url || item.path, '_blank')">
                      <Icon name="arrow-right-up"></Icon>
                      <p>Open</p>
                    </ContextMenuItem>
                    <ContextMenuItem @select.prevent>
                      <ConfirmationDialog
                        class="w-full"
                        :onConfirm="() => handleDeleteItem(item)"
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
                </Transition>
              </ContextMenuPortal>
            </ContextMenuRoot>
          </div>
          <div v-if="(data || []).length === 0" class="flex flex-col items-center justify-center text-muted">
            <p>This folder is empty</p>
          </div>
        </div>
        <div v-if="$slots['footer']" class="flex w-full flex-row items-end justify-end border-t-[1px] border-t-outline-variant p-4">
          <slot name="footer" v-bind="{ data: selectedObject }" />
        </div>
      </div>
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <Transition name="fade">
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
              :onSuccess="
                () => {
                  toast.success('Folder created successfully')
                  getData()
                }
                "
              >
              <template #trigger>
                <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10">
                  <Icon name="add"></Icon>
                  <p>Buat Folder Baru</p>
                </div>
              </template>
            </DialogForm>
          </ContextMenuItem>
        </ContextMenuContent>
      </Transition>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<style scoped>
tbody tr:not(:last-child) td {
  border-bottom: 1px solid rgb(var(--md-sys-color-outline-variant));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
