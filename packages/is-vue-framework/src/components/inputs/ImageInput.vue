<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import { defaultImageInputUpload, type ImageInputUploadBehavior } from '@southneuhof/is-vue-framework/behaviors/imageInput'
import { toast } from 'vue-sonner'
import ImagePreview from '@southneuhof/is-vue-framework/components/base/ImagePreview.vue'
import Draggable from 'vuedraggable'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'

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
  ...commonProps,
})

const modelValue = defineModel<Record<string, string> | Array<Record<string, string>>>()
const emit = defineEmits(['update:modelValue', 'update:uploadState', 'validation:touch'])

const uploadPercentage = ref(0)
const uploadDetail = ref()
const loading = ref(false)
const images = ref<Array<any>>([])
const isUploading = ref(false)

if (modelValue.value) {
  if (Array.isArray(modelValue.value)) images.value = modelValue.value
  else images.value = [modelValue.value]
}

const emitData = () => {
  if (props.multi) {
    emit('update:modelValue', images.value)
  } else emit('update:modelValue', images.value[0])
}

const handleFileUpload = (e: Event) => {
  loading.value = true
  const target = e.target as HTMLInputElement
  const file: File = (target.files as FileList)[0]
  const reader = new FileReader()
  reader.readAsDataURL(file)
  if (file.size > props.maxSize * 1000000) {
    toast.error('Ukuran berkas terlalu besar')
    return
  }
  if (!file) return
  uploadPercentage.value = 0
  isUploading.value = true
  props.fileUpload(file, props.uploadPath, (event: any) => {
      uploadDetail.value = file
      uploadPercentage.value = Math.round((100 * event.loaded) / event.total)
    })
    .then((res) => {
      if (props.transform) {
        for (const key of Object.keys(props.transform)) {
          res.data.data[props.transform[key]] = res.data.data[key]
          delete res.data.data[key]
        }
      }
      images.value.push(res)
      emitData()
      loading.value = false
      isUploading.value = false
      emit('validation:touch')
    })
    .catch((err) => {})
}

const removeItem = (index: number) => {
  images.value.splice(index, 1)
  emitData()
  emit('validation:touch')
}

watch(modelValue, () => {
  if (Array.isArray(modelValue.value)) images.value = [...modelValue.value]
  else if (modelValue.value) images.value = [modelValue.value]
  else images.value = []
})

function handleChange(event: any) {
  if (!props.multi) return
  images.value = images.value.map((item, index) => ({ ...item, order_number: index + 1 }))
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
            <Draggable v-if="images.length" v-model="images" item-key="url" class="flex flex-row items-center gap-4" @change="handleChange">
              <template #item="{ element, index }">
                <div class="w-fit cursor-move">
                  <ImagePreview v-if="element" :url="element.url" :thumbnail="element.tumbnail_url">
                    <template #actions>
                      <Button color="error" type="button" @click="removeItem(index)"><Icon name="delete-bin"></Icon></Button>
                    </template>
                  </ImagePreview>
                </div>
              </template>
            </Draggable>
            <template v-if="!isUploading">
              <label v-if="(props.multi && images.length != (props.limit == -1 ? 99999 : props.limit)) || (!props.multi && !images[0])">
                <a class="h-4 w-full cursor-pointer">
                  <div class="relative flex h-40 w-40 items-center justify-center rounded-xl outline-dashed outline-2 outline-outline">
                    <Icon name="image-add" size="36" class="text-surface-variant"></Icon>
                    <div class="absolute left-0 top-0 h-full w-full">
                      <div v-if="uploadPercentage != 0 && uploadPercentage != 100" class="absolute h-40 w-40 rounded-xl bg-tertiary/20" :style="{ width: uploadPercentage + '%' }"></div>
                    </div>
                  </div>
                  <input type="file" hidden id="file" :accept="'image/*'" class="rounded-md p-2" @change="handleFileUpload($event)" />
                </a>
              </label>
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
</template>
