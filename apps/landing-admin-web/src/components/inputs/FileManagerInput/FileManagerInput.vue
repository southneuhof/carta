<script setup lang="ts">
import FileManager from '@/components/utils/FileManager/FileManager.vue'
import BaseInput from '../BaseInput.vue'
import { commonProps } from '../commonprops'
import FileManagerDialogContent from './_layouts/FileManagerDialogContent.vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogScrollContent, DialogTitle, DialogTrigger, DialogClose } from '@/components/base/Dialog'
import { ref } from 'vue'

const props = defineProps({
  multi: {
    type: Boolean,
    default: false,
  },
  ...commonProps,
})

const modelValue = defineModel<any>()

const open = ref(false)
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
        {{ modelValue?.path }}
      </div>
    </div>
  </BaseInput>
</template>
