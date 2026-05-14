<script setup lang="ts">
import { ref } from 'vue'
import { TransitionRoot, TransitionChild, Dialog, DialogPanel } from '@headlessui/vue'
import { twMerge } from 'tailwind-merge'
import type { PropType } from 'vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  images: {
    type: Array as PropType<Array<{ url: string; thumbnail?: string }>>,
    required: true,
  },
  isOpen: {
    type: Boolean,
    required: false,
    default: false,
  },
  disableControls: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const isOpen = ref(props.isOpen)
const currentIndex = ref(0)

function openDialog(index: number) {
  if (props.images[index].url) {
    currentIndex.value = index
    isOpen.value = true
  }
}

function closeDialog() {
  isOpen.value = false
}

function nextImage() {
  currentIndex.value = (currentIndex.value + 1) % props.images?.length
}

function prevImage() {
  currentIndex.value = (currentIndex.value - 1 + props.images?.length) % props.images?.length
}

setInterval(() => {
  if (isOpen.value) return
  currentIndex.value = (currentIndex.value + 1) % props.images?.length
}, 8000)
</script>

<template>
  <div v-if="!($slots as any).trigger" :class="twMerge('relative flex aspect-square h-40 min-h-[120px] items-center justify-center rounded-xl bg-surface-container-high ', $attrs.class as string)">
    <div
      v-if="!props.disableControls && (props.images?.[currentIndex]?.thumbnail || props.images?.[currentIndex]?.url)"
      class="absolute flex h-full w-full flex-row items-center justify-center gap-2 rounded-xl bg-black/[12%] text-on-surface opacity-0 transition-opacity duration-100 hover:opacity-100"
    >
      <Button @click="() => openDialog(currentIndex)" color="info" size="square"><Icon name="eye"></Icon></Button>
      <slot name="actions" />
    </div>
    <div
      v-else
      @click="() => openDialog(currentIndex)"
      class="absolute flex h-full w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-xl bg-black/[12%] text-on-surface opacity-0 transition-opacity duration-100 hover:opacity-100"
    ></div>
    <img
      v-if="props.images?.[currentIndex]?.thumbnail || props.images?.[currentIndex]?.url"
      :src="props.images?.[currentIndex].thumbnail || props.images?.[currentIndex].url"
      class="h-full w-full rounded-xl bg-surface-container-high object-cover"
    />
    <div v-else class="flex h-full w-full items-center justify-center rounded-xl bg-surface-container-high">
      <slot v-if="$slots['no-image']" name="no-image" />
      <Icon v-else name="eye-off" />
    </div>
  </div>

  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeDialog" class="relative z-10" id="dialog">
      <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-100 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leave-from="opacity-50 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="max-w-screen-lg">
              <div class="relative">
                <button class="absolute right-4 top-4 text-on-surface" @click="closeDialog()">
                  <Icon name="close"></Icon>
                </button>
                <img class="h-full w-full rounded-xl object-scale-down" :src="props.images?.[currentIndex].url" />
                <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <Button size="square" :disabled="currentIndex === 0" @click="prevImage"><Icon name="arrow-left-s"></Icon></Button>
                  <span class="text-white">{{ currentIndex + 1 }} / {{ props.images.length }}</span>
                  <Button size="square" :disabled="currentIndex === props.images.length - 1" @click="nextImage"><Icon name="arrow-right-s"></Icon></Button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
