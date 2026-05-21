<script setup lang="ts">
import FileManager from '@/components/utilities/FileManager/FileManager.vue'
import BaseInput from '../BaseInput.vue'
import { commonProps } from '../commonprops'
import { Dialog, DialogContent, DialogTrigger } from '@/components/base/Dialog'
import { ref } from 'vue'
import config from '@/config'

const props = defineProps({
  multi: {
    type: Boolean,
    default: false,
  },
  ...commonProps,
})

const modelValue = defineModel<any>()

const open = ref(false)

function isImageAsset(item: any): boolean {
  return typeof item?.content_type === 'string' && item.content_type.startsWith('image/')
}

function itemPreviewUrl(item: any): string {
  if (!item?.path) return ''
  if (typeof item.url === 'string' && item.url) return item.url
  try {
    return new URL(item.path, config.apiUrl).toString()
  } catch {
    return item.path
  }
}
</script>

<template>
  <BaseInput v-bind="props" :error="error">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row items-center gap-2 rounded-lg outline outline-1 outline-outline/[24%]">
        <Dialog v-model:open="open">
          <DialogTrigger class="flex items-start justify-start">
            <button
              type="button"
              class="overlay flex flex-row items-center gap-2 rounded-bl-lg rounded-tl-lg bg-primary px-4 py-2 text-on-primary after:bg-on-primary/[8%] active:after:bg-on-primary/[12%]"
            >
              <p>Browse Files</p>
              <Icon name="folder-2" />
            </button>
          </DialogTrigger>
          <DialogContent class="flex h-[60vh] max-w-[60vw] flex-col">
            <FileManager :multi="props.multi" :activePath="modelValue?.type === 'folder' ? modelValue?.path : modelValue?.path.split('/').slice(0, -1).join('/')" :activeObject="modelValue">
              <template #footer="{ data }">
                <div class="flex flex-row items-center justify-center gap-2">
                  <Button variant="icon" @click="() => (open = false)">Cancel</Button>
                  <Button
                    :disabled="!data"
                    @click="
                      () => {
                        modelValue = data
                        open = false
                      }
                    "
                    >Open</Button
                  >
                </div>
              </template>
            </FileManager>
          </DialogContent>
        </Dialog>
        <div class="flex min-h-[40px] min-w-0 flex-1 items-center p-2">
          <template v-if="modelValue?.path">
            <div v-if="isImageAsset(modelValue)" class="flex items-center gap-3">
              <img :src="itemPreviewUrl(modelValue)" :alt="modelValue?.filename || 'asset'" class="h-10 w-10 rounded-md object-cover" />
              <p class="truncate text-sm">{{ modelValue?.filename || modelValue?.path }}</p>
            </div>
            <div v-else class="flex items-center gap-2">
              <Icon name="file" />
              <p class="truncate text-sm">{{ modelValue?.filename || modelValue?.path }}</p>
            </div>
          </template>
          <p v-else class="text-sm text-muted">No asset selected</p>
        </div>
      </div>
    </div>
  </BaseInput>
</template>
