<script setup lang="ts">
import { TransitionRoot, TransitionChild, Dialog, DialogPanel } from '@headlessui/vue'
import { computed, ref, useSlots, watch } from 'vue'
import { twMerge } from 'tailwind-merge'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  url: {
    type: String,
  },
  thumbnail: {
    type: String,
    required: false,
  },
  isOpen: {
    type: Boolean,
    required: false,
    default: false,
  },
  square: {
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

const slots = useSlots()

const isOpen = ref(props.isOpen)
const thumbnailError = ref(false)
const detailError = ref(false)

const imageCandidates = computed(() => {
  const list = [props.thumbnail, props.url].filter((item): item is string => Boolean(item))
  return [...new Set(list)]
})

const thumbnailSrc = computed(() => {
  if (thumbnailError.value) {
    return imageCandidates.value[1] ?? null
  }
  return imageCandidates.value[0] ?? null
})

const detailSrc = computed(() => {
  if (detailError.value) {
    return imageCandidates.value[1] ?? null
  }
  return imageCandidates.value[0] ?? null
})

watch(
  () => [props.thumbnail, props.url],
  () => {
    thumbnailError.value = false
    detailError.value = false
  },
)

function onThumbnailError() {
  if (!thumbnailError.value && imageCandidates.value.length > 1) {
    thumbnailError.value = true
    return
  }
  thumbnailError.value = true
}

function onDetailError() {
  if (!detailError.value && imageCandidates.value.length > 1) {
    detailError.value = true
    return
  }
  detailError.value = true
}

function openDialog() {
  if (slots['image-thumbnail']) {
    isOpen.value = true
    return
  }
  if (thumbnailSrc.value || detailSrc.value) isOpen.value = true
}

function closeDialog() {
  isOpen.value = false
}
</script>

<template>
  <div v-if="!$slots.trigger" :class="twMerge('relative flex aspect-square h-40 min-h-[120px] items-center justify-center rounded-xl bg-surface-container-high ', $attrs.class as string)">
    <div
      v-if="!props.disableControls && (props.thumbnail || props.url)"
      class="absolute flex h-full w-full flex-row items-center justify-center gap-2 rounded-xl bg-black/[12%] text-on-surface opacity-0 transition-opacity duration-100 hover:opacity-100"
    >
      <Button @click="() => openDialog()" color="info" size="square"><Icon size="lg" name="eye"></Icon></Button>
      <slot name="actions" />
    </div>
    <div
      v-else
      @click="() => openDialog()"
      class="absolute flex h-full w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-xl bg-black/[12%] text-on-surface opacity-0 transition-opacity duration-100 hover:opacity-100"
    ></div>
    <div v-if="$slots['image-description']" class="absolute bottom-4 rounded-xl bg-scrim/[18%] px-4 py-2 text-sm text-white">
      <slot name="image-description" />
    </div>
    <slot v-if="$slots['image-thumbnail']" name="image-thumbnail" />
    <template v-else>
      <img v-if="thumbnailSrc" class="h-full w-full rounded-xl bg-surface-container-high object-cover" :src="thumbnailSrc" @error="onThumbnailError" />
      <div v-else class="flex h-full w-full items-center justify-center rounded-xl bg-surface-container-high">
        <div v-if="$slots['no-image']" class="text-sm text-muted">
          <slot name="no-image" />
        </div>
        <Icon v-else size="lg" name="user"></Icon>
      </div>
    </template>
  </div>
  <div v-else @click="() => openDialog()">
    <slot name="trigger" />
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
            <div class="fixed inset-0 overflow-y-auto">
              <div class="flex min-h-full items-center justify-center">
                <DialogPanel class="max-w-screen-lg">
                  <div class="relative">
                    <button class="absolute right-4 top-4 text-on-surface" @click="closeDialog()"><Icon name="close"></Icon></button>
                    <slot v-if="$slots['image-detail']" name="image-detail" />
                    <img v-else-if="detailSrc" class="h-full rounded-xl bg-surface-container-high object-scale-down" :src="detailSrc" @error="onDetailError" />
                    <div v-else class="flex h-[240px] w-[240px] items-center justify-center rounded-xl bg-surface-container-high text-muted">
                      <Icon size="lg" name="user"></Icon>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
