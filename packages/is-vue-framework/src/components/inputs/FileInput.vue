<script setup lang="ts">
import { ref, watch, computed, type PropType } from 'vue'
import { defaultFileInputUpload, type FileInputUploadBehavior } from '@southneuhof/is-vue-framework/behaviors/fileInput'
import FileComponent from '@southneuhof/is-vue-framework/components/base/FileComponent.vue'
import { toast } from 'vue-sonner'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import { MIME_TYPE_NAMES } from '@southneuhof/utilities/object'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Tooltip from '@southneuhof/is-vue-framework/components/base/Tooltip.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import FileManager from '@southneuhof/is-vue-framework/components/utils/FileManager/FileManager.vue'
import { Dialog, DialogContent } from '@southneuhof/is-vue-framework/components/base/Dialog/index'
import { normalizeFileAssetValue, type FileAssetValue } from './assetValue'
import { useDropZone } from '@vueuse/core'

const props = defineProps({
  accept: {
    type: Array<string>,
    required: false,
    default: undefined,
  },
  maxSize: {
    type: Number,
    required: false,
    default: undefined,
  },
  multi: {
    type: Boolean,
    required: false,
    default: false,
  },
  uploadPath: {
    type: String,
    default: '',
  },
  fileUpload: {
    type: Function as PropType<FileInputUploadBehavior>,
    default: defaultFileInputUpload,
  },
  ...commonProps,
})
const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

const acceptTypes = computed(() => props.accept ?? [])
const maxFileSize = computed(() => props.maxSize ?? 10)
const acceptTypesPretty = computed(() => acceptTypes.value.map((type: string) => MIME_TYPE_NAMES[type] ?? type))

const uploadPercentage = ref(0)
const uploadDetail = ref()
const loading = ref(false)
const items = ref<Array<FileAssetValue>>([])
const isUploading = ref(false)
const sourcePopoverOpen = ref(false)
const fileManagerOpen = ref(false)
const fileInput = ref<HTMLInputElement>()
const dropZoneRef = ref<HTMLDivElement>()

const modelValue = defineModel<any>()
if (modelValue.value) {
  if (Array.isArray(modelValue.value)) {
    items.value = modelValue.value.map((item) => normalizeFileAssetValue(item)).filter((item): item is FileAssetValue => Boolean(item))
  } else {
    const normalized = normalizeFileAssetValue(modelValue.value)
    if (normalized) items.value.push(normalized)
  }
}

function emitChanges() {
  if (props.multi) modelValue.value = items.value
  else modelValue.value = items.value[0] || null
}

const handleFileUpload = (files: File | File[]) => {
  const incomingFiles = Array.isArray(files) ? files : [files]
  const fileArray = props.multi ? incomingFiles : incomingFiles.slice(0, 1)

  fileArray.forEach((file) => {
    if (!validateFileLike(file.type, file.size)) return
    isUploading.value = true
    props.fileUpload(file, props.uploadPath, (event: any) => {
        uploadDetail.value = file
        uploadPercentage.value = Math.round((100 * event.loaded) / event.total)
      })
      .then((res) => {
        const normalized = normalizeFileAssetValue(res)
        if (!normalized) throw new Error('Invalid upload response')
        if (props.multi) items.value.push(normalized)
        else items.value = [normalized]
        loading.value = false
        uploadPercentage.value = 0
        isUploading.value = false
        emitChanges()
        emit('validation:touch')
      })
      .catch((err) => {
        toast.error(`Gagal mengunggah berkas: ${err}`)
        isUploading.value = false
      })
  })
}

function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  handleFileUpload(Array.from(target.files ?? []))
  target.value = ''
}

function openDevicePicker() {
  sourcePopoverOpen.value = false
  fileInput.value?.click()
}

function openFileManager() {
  sourcePopoverOpen.value = false
  fileManagerOpen.value = true
}

function validateFileLike(contentType?: string, size?: number): boolean {
  if (acceptTypes.value.length > 0 && contentType && !acceptTypes.value.includes(contentType)) {
    toast.error(`Tipe berkas tidak didukung. Tipe berkas yang diterima adalah ${acceptTypes.value.join(', ')}`)
    return false
  }
  if (typeof size === 'number' && size > maxFileSize.value * 1024 * 1024) {
    toast.error(`Ukuran berkas terlalu besar. Maksimal ${maxFileSize.value}MB`)
    return false
  }
  return true
}

function selectFileManagerAsset(payload: unknown) {
  const normalized = normalizeFileAssetValue(payload)
  if (!normalized || normalized.type === 'folder') return
  if (!validateFileLike(normalized.content_type, normalized.size)) return

  if (props.multi) items.value.push(normalized)
  else items.value = [normalized]

  emitChanges()
  emit('validation:touch')
  fileManagerOpen.value = false
}

function handleFileDelete(index: number) {
  items.value.splice(index, 1)
  emitChanges()
  if (!props.multi) items.value = []
  emit('validation:touch')
}

watch(modelValue, () => {
  if (Array.isArray(modelValue.value)) items.value = modelValue.value.map((item) => normalizeFileAssetValue(item)).filter((item): item is FileAssetValue => Boolean(item))
  else if (modelValue.value) {
    const normalized = normalizeFileAssetValue(modelValue.value)
    items.value = normalized ? [normalized] : []
  }
  else items.value = []

})

function onDrop(files?: File[] | null) {
  if (files?.length) handleFileUpload(files)
}

const { isOverDropZone } = useDropZone(dropZoneRef as any, onDrop)
</script>

<template>
  <BaseInput v-bind="props">
    <div class="mb-4" v-if="uploadPercentage != 0 && uploadPercentage != 100">
      <div class="relative flex h-6 items-center rounded-full border border-gray-200">
        <div class="absolute ml-2 text-sm text-blue-200">{{ uploadPercentage }}%</div>
        <div class="h-full rounded-full bg-blue-500" :style="{ width: uploadPercentage + '%' }"></div>
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <div v-if="items.length > 0" class="flex flex-row flex-wrap items-center gap-4">
        <template v-for="(item, index) in items" :key="index">
          <FileComponent
            :filename="item?.filename || item.path.split('/').pop()"
            :url="item?.url"
            :ext="item?.url?.split('.')[1]"
            :action="{
              label: 'Hapus',
              action: () => handleFileDelete(index),
            }"
          />
        </template>
      </div>
      <template v-if="!isUploading">
        <div v-if="props.multi || items.length == 0" class="flex flex-col gap-2">
          <div ref="dropZoneRef" class="flex w-full flex-col items-center justify-center gap-4 rounded-md py-8 outline-dashed outline-2 outline-outline/[24%]" :class="{ 'bg-primary/10 outline-primary/[33%]': isOverDropZone }">
            <div v-if="!isOverDropZone" class="flex flex-row items-center gap-4">
              <div class="text-black-light font-bold">Letakkan file anda di sini</div>
              <div class="text-black-light">/</div>
              <Popover v-model="sourcePopoverOpen">
                <template #trigger>
                  <Button type="button">
                    <template #icon>
                      <Icon name="add-circle"></Icon>
                    </template>
                    <div>Pilih sumber file</div>
                  </Button>
                </template>
                <template #content>
                  <div class="min-w-56 rounded-lg border border-outline/[12%] bg-surface-container p-1 text-on-surface shadow-elevation-3">
                    <button type="button" class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-on-surface/[8%]" @click="openDevicePicker">
                      <Icon name="upload-cloud" size="sm" />
                      <span>Upload from device</span>
                    </button>
                    <button type="button" class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-on-surface/[8%]" @click="openFileManager">
                      <Icon name="folder-2" size="sm" />
                      <span>Choose from file manager</span>
                    </button>
                  </div>
                </template>
              </Popover>
              <input ref="fileInput" type="file" hidden :multiple="props.multi" :accept="acceptTypes.join(',') || undefined" class="rounded-md p-2" @change="handleInputChange" />
            </div>
            <div v-else>
              <div class="flex flex-col items-center justify-center gap-4">
                <div><Icon name="upload-cloud"></Icon></div>
                <div class="text-black-light font-bold">Lepaskan kursor untuk mengunggah</div>
              </div>
            </div>
          </div>
          <div v-if="acceptTypes.length > 0 || maxSize" class="flex flex-row gap-4">
            <div class="flex flex-row items-center gap-2">
              <Tooltip v-if="acceptTypes.length > 0 || maxSize">
                <template #trigger>
                  <div class="flex flex-row items-center gap-1 text-muted">
                    <Icon name="information" size="xs" :fill="true"></Icon>
                    <p class="text-sm">File yang diterima</p>
                  </div>
                </template>
                <template #content>
                  <div class="flex flex-col gap-2">
                    <div v-if="acceptTypes.length > 0" class="flex flex-col">
                      <p class="text-sm uppercase text-white/[67%]">Tipe File</p>
                      <p class="text-sm">{{ acceptTypesPretty.join(', ') }}</p>
                    </div>
                    <div v-if="maxFileSize" class="flex flex-col">
                      <p class="text-sm uppercase text-white/[67%]">Maksimal Ukuran File</p>
                      <p class="text-sm">{{ maxFileSize }}MB</p>
                    </div>
                  </div>
                </template>
              </Tooltip>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="flex min-h-[12rem] flex-col items-center justify-center gap-2 py-8">
        <Spinner />
        <p class="text-xs">Uploading...</p>
      </div>
    </div>
  </BaseInput>
  <Dialog v-model:open="fileManagerOpen">
    <DialogContent class="flex h-[60vh] max-w-[60vw] flex-col">
      <FileManager :activePath="props.uploadPath || '/storage/public'">
        <template #footer="{ data }">
          <div class="flex flex-row items-center justify-end gap-2">
            <Button kind="button" variant="text" type="button" @click="() => (fileManagerOpen = false)">Cancel</Button>
            <Button type="button" :disabled="!data || data.type === 'folder'" @click="() => selectFileManagerAsset(data)">Open</Button>
          </div>
        </template>
      </FileManager>
    </DialogContent>
  </Dialog>
</template>
