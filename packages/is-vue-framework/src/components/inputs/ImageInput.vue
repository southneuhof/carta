<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import { defaultImageInputUpload, defaultImageURLResolver, type ImageInputUploadBehavior, type ImageInputURLResolverBehavior } from '@southneuhof/is-vue-framework/behaviors/imageInput'
import { toast } from 'vue-sonner'
import ImagePreview from '@southneuhof/is-vue-framework/components/base/ImagePreview.vue'
import Draggable from 'vuedraggable'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import FileManager from '@southneuhof/is-vue-framework/components/utils/FileManager/FileManager.vue'
import { Dialog, DialogContent } from '@southneuhof/is-vue-framework/components/base/Dialog/index'
import { isImageAssetValue, normalizeFileAssetValue, type FileAssetValue } from './assetValue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: false,
  },
  maxSize: {
    type: Number,
    required: false,
    default: 5,
  },
  disableInformation: {
    type: Boolean,
    required: false,
    default: false,
  },
  multi: {
    type: Boolean,
    required: false,
    default: false,
  },
  limit: {
    type: Number,
    required: false,
    default: -1,
  },
  additionalInfo: {
    type: String,
    required: false,
    default: '',
  },
  transform: {
    type: Object,
    required: false,
  },
  uploadPath: {
    type: String,
    default: '',
  },
  fileUpload: {
    type: Function as PropType<ImageInputUploadBehavior>,
    default: defaultImageInputUpload,
  },
  imageURLResolver: {
    type: Function as PropType<ImageInputURLResolverBehavior>,
    default: defaultImageURLResolver,
  },
  ...commonProps,
})

type ImageAssetValue = FileAssetValue & { order_number?: number }

const modelValue = defineModel<ImageAssetValue | Array<ImageAssetValue>>()
const emit = defineEmits(['update:modelValue', 'update:uploadState', 'validation:touch'])

const uploadPercentage = ref(0)
const uploadDetail = ref()
const loading = ref(false)
const images = ref<Array<any>>([])
const isUploading = ref(false)
const isDragActive = ref(false)
const isReplaceDragActive = ref(false)
const fileInput = ref<HTMLInputElement>()
const sourcePopoverOpen = ref(false)
const fileManagerOpen = ref(false)

if (modelValue.value) {
  if (Array.isArray(modelValue.value)) images.value = modelValue.value.map((item) => normalizeImageAsset(item)).filter((item): item is ImageAssetValue => Boolean(item))
  else {
    const normalized = normalizeImageAsset(modelValue.value)
    images.value = normalized ? [normalized] : []
  }
}

const emitData = () => {
  if (props.multi) {
    emit('update:modelValue', images.value)
  } else emit('update:modelValue', images.value[0])
}

const handleUpload = (file?: File, options: { replace?: boolean } = {}) => {
  if (!file) return
  loading.value = true
  if (file.size > props.maxSize * 1000000) {
    toast.error('Ukuran berkas terlalu besar')
    loading.value = false
    return
  }
  uploadPercentage.value = 0
  isUploading.value = true
  props.fileUpload(file, props.uploadPath, (event: any) => {
      uploadDetail.value = file
      uploadPercentage.value = Math.round((100 * event.loaded) / event.total)
    })
    .then((res) => {
      const normalized = normalizeImageAsset(res)
      if (!normalized) throw new Error('Invalid upload response')
      if (options.replace && !props.multi && images.value.length) {
        images.value.splice(0, 1, normalized)
      } else {
        images.value.push(normalized)
      }
      emitData()
      loading.value = false
      isUploading.value = false
      emit('validation:touch')
    })
    .catch(() => {
      loading.value = false
      isUploading.value = false
    })
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  handleUpload(file)
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

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (isUploading.value) return
  isDragActive.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragActive.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragActive.value = false
  if (isUploading.value) return
  const file = event.dataTransfer?.files?.[0]
  handleUpload(file)
}

const handleReplaceDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (isUploading.value || props.multi || !images.value[0]) return
  isReplaceDragActive.value = true
}

const handleReplaceDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isReplaceDragActive.value = false
}

const handleReplaceDrop = (event: DragEvent) => {
  event.preventDefault()
  isReplaceDragActive.value = false
  if (isUploading.value || props.multi || !images.value[0]) return
  const file = event.dataTransfer?.files?.[0]
  handleUpload(file, { replace: true })
}

const removeItem = (index: number) => {
  images.value.splice(index, 1)
  emitData()
  emit('validation:touch')
}

watch(modelValue, () => {
  if (Array.isArray(modelValue.value)) images.value = modelValue.value.map((item) => normalizeImageAsset(item)).filter((item): item is ImageAssetValue => Boolean(item))
  else if (modelValue.value) {
    const normalized = normalizeImageAsset(modelValue.value)
    images.value = normalized ? [normalized] : []
  }
  else images.value = []
})

function handleChange(event: any) {
  if (!props.multi) return
  images.value = images.value.map((item, index) => ({ ...item, order_number: index + 1 }))
}

function resolvePreviewURLs(payload: ImageAssetValue) {
  return props.imageURLResolver(payload)
}

function resolveDragKey(item: ImageAssetValue, index: number): string {
  return item?.url || item?.path || item?.data || `image-${index}`
}

function normalizeImageAsset(payload: unknown): ImageAssetValue | null {
  const normalized = normalizeFileAssetValue(payload)
  if (!normalized) return null

  if (props.transform) {
    const transformed = { ...normalized }
    for (const key of Object.keys(props.transform)) {
      transformed[props.transform[key]] = transformed[key]
    }
    return transformed as ImageAssetValue
  }

  return normalized as ImageAssetValue
}

function selectFileManagerAsset(payload: unknown) {
  if (!isImageAssetValue(payload)) {
    toast.error('Berkas yang dipilih bukan gambar')
    return
  }

  const normalized = normalizeImageAsset(payload)
  if (!normalized) return

  if (!props.multi) images.value = [normalized]
  else if (props.limit === -1 || images.value.length < props.limit) images.value.push(normalized)

  emitData()
  emit('validation:touch')
  fileManagerOpen.value = false
}
</script>

<template>
  <BaseInput v-bind="props">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex flex-col gap-2">
          <div v-if="!props.disableInformation" class="flex flex-col gap-2">
            <div v-if="props.multi || (!props.multi && !images[0])">
              <div class="font-bold text-tertiary">Unggah gambar yang akan digunakan</div>
              <div v-if="props.maxSize != 1000000" class="text-sm text-muted">Ukuran berkas maksimal {{ props.maxSize }} MB</div>
              <div v-if="!(props.limit == 1 || props.limit == -1)" class="text-sm text-muted">Maksimal {{ props.limit }} gambar</div>
              <div v-if="props.additionalInfo" class="mt-2">
                <Chip color="info">{{ props.additionalInfo }}</Chip>
              </div>
            </div>
            <div v-else class="font-semibold text-tertiary">{{ images.length }} gambar diunggah</div>
          </div>
          <div class="flex flex-row items-center gap-4">
            <Draggable v-if="images.length" v-model="images" :item-key="resolveDragKey" class="flex flex-row items-center gap-4" @change="handleChange">
              <template #item="{ element, index }">
                <div
                  class="w-fit cursor-move rounded-xl transition-colors"
                  :class="{ 'bg-tertiary/10 outline outline-1 outline-primary/[33%]': isReplaceDragActive && !props.multi && index === 0 }"
                  @dragover="handleReplaceDragOver"
                  @dragleave="handleReplaceDragLeave"
                  @drop="handleReplaceDrop"
                >
                  <ImagePreview v-if="element" :imageURL="resolvePreviewURLs(element).imageURL" :thumbnailURL="resolvePreviewURLs(element).thumbnailURL">
                    <template #actions>
                      <Button color="error" kind="icon" @click="removeItem(index)" type="button">
                        <template #icon>
                          <Icon name="delete-bin"></Icon>
                        </template>
                      </Button>
                    </template>
                  </ImagePreview>
                </div>
              </template>
            </Draggable>
            <template v-if="!isUploading">
              <Popover v-if="(props.multi && images.length != (props.limit == -1 ? 99999 : props.limit)) || (!props.multi && !images[0])" v-model="sourcePopoverOpen">
                <template #trigger>
                  <button
                    type="button"
                    class="relative flex h-40 w-40 items-center justify-center rounded-xl outline-dashed outline-2 outline-outline transition-colors"
                    :class="{ 'bg-primary/10 outline-primary/[33%]': isDragActive }"
                    @dragover="handleDragOver"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop"
                  >
                    <Icon name="image-add" size="2xl" class="text-on-surface"></Icon>
                    <div class="absolute left-0 top-0 h-full w-full">
                      <div v-if="uploadPercentage != 0 && uploadPercentage != 100" class="absolute h-40 w-40 rounded-xl bg-tertiary/20" :style="{ width: uploadPercentage + '%' }"></div>
                    </div>
                  </button>
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
              <input ref="fileInput" type="file" hidden :accept="'image/*'" class="rounded-md p-2" @change="handleFileUpload($event)" />
            </template>
            <div v-else class="relative flex h-40 w-40 flex-col items-center justify-center rounded-xl outline-dashed outline-2 outline-outline">
              <Spinner />
              <p class="text-xs">Uploading...</p>
            </div>
          </div>
        </div>
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
