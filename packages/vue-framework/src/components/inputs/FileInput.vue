<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'
import FileComponent from '@southneuhof/is-vue-framework/components/base/FileComponent.vue'
import { toast } from 'vue-sonner'
import UploadDropzone from './UploadDropzone.vue'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import { MIME_TYPE_NAMES } from '@southneuhof/is-vue-framework/utils/object'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import Tooltip from '@southneuhof/is-vue-framework/components/base/Tooltip.vue'

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
const items = ref<Array<Record<string, any>>>([])
const isUploading = ref(false)

const modelValue = defineModel<any>()
if (modelValue.value) {
  if (Array.isArray(modelValue.value)) {
    items.value = modelValue.value
  } else items.value.push(modelValue.value)
}

function emitChanges() {
  if (props.multi) modelValue.value = items.value
  else modelValue.value = items.value[0] || null
}

const handleFileUpload = (files: File | File[]) => {
  const fileArray = Array.isArray(files) ? files : [files]

  fileArray.forEach((file) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    if (acceptTypes.value && acceptTypes.value.length > 0) {
      if (!acceptTypes.value.find((type: string) => type === file.type)) {
        toast.error(`Tipe berkas tidak didukung. Tipe berkas yang diterima adalah ${acceptTypes.value.join(', ')}`)
        return
      }
    }
    if (file.size > maxFileSize.value * 1024 * 1024) {
      toast.error(`Ukuran berkas terlalu besar. Maksimal ${maxFileSize.value}MB`)
      return
    }
    isUploading.value = true
    const fileUpload = getFrameworkBehaviors().upload?.fileUpload
    if (!fileUpload) missingBehavior('upload.fileUpload')
    fileUpload(file, props.uploadPath, (event: any) => {
        uploadDetail.value = file
        uploadPercentage.value = Math.round((100 * event.loaded) / event.total)
      })
      .then((res) => {
        items.value.push(res)
        loading.value = false
        uploadPercentage.value = 0
        isUploading.value = false
        emitChanges()
        emit('validation:touch')
      })
      .catch((err) => {
        toast.error(`Gagal mengunggah berkas: ${err}`)
      })
  })
}

function handleFileDelete(index: number) {
  console.log('gamer')
  items.value.splice(index, 1)
  emitChanges()
  if (!props.multi) items.value = []
  emit('validation:touch')
}

watch(modelValue, () => {
  if (Array.isArray(modelValue.value)) items.value = [...modelValue.value]
  else if (modelValue.value) items.value = [modelValue.value]
  else items.value = []

})
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
          <UploadDropzone @update:modelValue="handleFileUpload($event)" :accept="acceptTypes" :multi="props.multi" />
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
</template>
