<script setup lang="ts">
import FileManager from '@southneuhof/is-vue-framework/components/utils/FileManager/FileManager.vue'
import BaseInput from '../BaseInput.vue'
import { commonProps } from '../commonprops'
import { Dialog, DialogContent, DialogTrigger } from '@southneuhof/is-vue-framework/components/base/Dialog/index'
import { computed, ref } from 'vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import frameworkDefaults from '@southneuhof/is-vue-framework/adapters/defaults'
import { normalizeFileAssetValue } from '../assetValue'

const props = defineProps({
  multi: {
    type: Boolean,
    default: false,
  },
  ...commonProps,
})

const modelValue = defineModel<any>()

const open = ref(false)
const selectedItems = computed(() => {
  const values = Array.isArray(modelValue.value) ? modelValue.value : modelValue.value ? [modelValue.value] : []
  return values.map((item) => normalizeFileAssetValue(item)).filter(Boolean)
})

function isImageAsset(item: any): boolean {
  return typeof item?.content_type === 'string' && item.content_type.startsWith('image/')
}

function itemPreviewUrl(item: any): string {
  if (!item?.path) return ''
  if (typeof item.url === 'string' && item.url) return item.url
  try {
    return new URL(item.path, frameworkDefaults.apiUrl).toString()
  } catch {
    return item.path
  }
}

function commitSelectedAsset(data: any) {
  const normalized = normalizeFileAssetValue(data)
  if (props.multi) {
    const current = Array.isArray(modelValue.value) ? modelValue.value : []
    modelValue.value = normalized ? [...current, normalized] : current
  } else {
    modelValue.value = normalized
  }
  open.value = false
}

function activePath(): string {
  const value = Array.isArray(modelValue.value) ? modelValue.value[0] : modelValue.value
  if (value?.type === 'folder') return value.path
  if (typeof value?.path === 'string') return value.path.split('/').slice(0, -1).join('/')
  return '/storage/public'
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
            <FileManager :multi="props.multi" :activePath="activePath()" :activeObject="modelValue">
              <template #footer="{ data }">
                <div class="flex flex-row items-center justify-center gap-2">
                  <Button kind="icon" variant="standard" @click="() => (open = false)">Cancel</Button>
                  <Button
                    :disabled="!data"
                    @click="() => commitSelectedAsset(data)"
                    >Open</Button
                  >
                </div>
              </template>
            </FileManager>
          </DialogContent>
        </Dialog>
        <div class="flex min-h-[40px] min-w-0 flex-1 items-center p-2">
          <template v-if="selectedItems.length">
            <div class="flex min-w-0 flex-col gap-2">
              <div v-for="item in selectedItems" :key="item?.path" class="flex min-w-0 items-center gap-3">
                <img v-if="isImageAsset(item)" :src="itemPreviewUrl(item)" :alt="item?.filename || 'asset'" class="h-10 w-10 rounded-md object-cover" />
                <Icon v-else name="file" />
                <p class="truncate text-sm">{{ item?.filename || item?.path }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-muted">No asset selected</p>
        </div>
      </div>
    </div>
  </BaseInput>
</template>
