<script setup lang="ts">
import { parse } from '@southneuhof/is-vue-framework/utils/parse'
import { ref, watch } from 'vue'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import { useDropZone } from '@vueuse/core'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger, ContextMenuRoot } from 'radix-vue'
import { toast } from 'vue-sonner'
import ConfirmationModal from '@southneuhof/is-vue-framework/components/composites/ConfirmationModal.vue'
import config from '@southneuhof/is-vue-framework/adapters/defaults'
import ModalForm from '@southneuhof/is-vue-framework/components/composites/ModalForm.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

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
})

const data = ref()
const modelValue = defineModel<any>()
const searchParameters = ref({ dir: modelValue.value?.path, sort_by: 'updated_at', sort: 'desc', limit: 1000 })
const contextMenuItem = ref()

const dropZoneRef = ref<HTMLElement>()

const columns = ref([
  { label: 'Name', key: 'name', width: 'auto' },
  { label: 'Updated At', key: 'updated_at', width: '200px' },
])

async function getData() {
  const listFiles = getFrameworkBehaviors().fileManager?.listFiles
  if (!listFiles) missingBehavior('fileManager.listFiles')
  const responseData = await listFiles(searchParameters.value)

  if (Array.isArray(responseData) && responseData.length > 0 && typeof responseData[0] === 'object' && responseData[0] !== null && '0' in responseData[0]) {
    data.value = responseData.map((item: any) => item[Object.keys(item)[0]])
  } else {
    data.value = responseData
  }
}

watch(searchParameters, getData, { deep: true })

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
    const uploadFile = getFrameworkBehaviors().fileManager?.uploadFile ?? getFrameworkBehaviors().upload?.fileUpload
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

function syncFiles() {
  const sync = getFrameworkBehaviors().fileManager?.syncFiles
  if (!sync) missingBehavior('fileManager.syncFiles')
  return sync(modelValue.value?.path)
}

function deleteFile(path: string) {
  const behavior = getFrameworkBehaviors().fileManager?.deleteFile
  if (!behavior) missingBehavior('fileManager.deleteFile')
  return behavior(path)
}
</script>

<template>
  <ContextMenuRoot class="h-full">
    <ContextMenuTrigger class="h-full">
      <div ref="dropZoneRef" class="relative flex h-full flex-col gap-4">
        <div v-if="isOverDropZone" class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10">
          <p class="font-semibold text-primary">Drop files to upload</p>
        </div>
        <div class="p-4">
          <div class="flex flex-row items-center gap-4">
            <!-- <div class="flex flex-row items-center"></div> -->
            <div>
              <div class="flex flex-row items-center gap-1">
                <p class="text-xl font-semibold">{{ modelValue?.path.split('/').pop() }}</p>
                <Button
                  size="square"
                  variant="icon"
                  class="!p-1"
                  @click="
                    () => {
                      toast.promise(syncFiles(), {
                        loading: 'Syncing files...',
                        success: () => {
                          getData()
                          return 'Files synced successfully'
                        },
                        error: 'Failed to sync files',
                      })
                    }
                  "
                >
                  <Icon name="refresh" size="md" class="text-on-surface"></Icon>
                </Button>
              </div>
              <div class="flex flex-row flex-wrap items-center gap-1">
                <template v-for="(segment, index) in modelValue?.path.split('/')" :key="index">
                  <button
                    v-if="Number(index) != modelValue?.path.split('/').length - 1"
                    class="text-sm text-muted underline"
                    @click="
                      () =>
                        (modelValue.path = modelValue?.path
                          .split('/')
                          .slice(0, Number(index) + 1)
                          .join('/'))
                    "
                  >
                    {{ segment }}
                  </button>
                  <span v-else class="text-sm text-muted">{{ segment }}</span>
                  <Icon v-if="Number(index) < modelValue?.path.split('/').length - 1" name="arrow-right-s" size="sm" class="text-muted"></Icon>
                </template>
              </div>
            </div>
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
          <table ref="tableRef" class="w-full table-fixed border-collapse" v-columns-resizable>
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
                  <!-- <div class="absolute top-0 right-0 w-[5px] cursor-col-resize h-full bg-transparent" @mousedown.stop="startResize($event, index)"></div> -->
                </th>
              </tr>
            </thead>
            <tbody>
              <ContextMenuRoot v-for="item in data" :key="item.id">
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
                    <ContextMenuContent class="z-1 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
                      <ContextMenuItem
                        class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10"
                        @select.prevent
                        @click="() => _window.open(`${config.apiUrl}read-file/${item.path}`, '_blank')"
                      >
                        <Icon name="arrow-right-up"></Icon>
                        <p>Open</p>
                      </ContextMenuItem>
                      <!-- <ContextMenuItem class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-on-surface/10 cursor-pointer" @select.prevent>
                        Download
                      </ContextMenuItem> -->
                      <ContextMenuItem @select.prevent>
                        <ConfirmationModal
                          class="w-full"
                          :onConfirm="
                            () =>
                              deleteFile(item.path)
                                .then(() => {
                                  toast.success('File deleted successfully')
                                  getData()
                                })
                                .catch(() => toast.error('Failed to delete file'))
                          "
                        >
                          <template #trigger>
                            <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-error hover:bg-on-surface/10">
                              <Icon name="delete-bin"></Icon>
                              <p>Delete</p>
                            </div>
                          </template>
                        </ConfirmationModal>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </Transition>
                </ContextMenuPortal>
              </ContextMenuRoot>
            </tbody>
          </table>
          <div v-if="data.length === 0" class="flex flex-col items-center justify-center text-muted">
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
        <ContextMenuContent class="z-1 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
          <ContextMenuItem @select.prevent>
            <ModalForm
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
              targetAPI="create-folder?custom"
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
            </ModalForm>
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
