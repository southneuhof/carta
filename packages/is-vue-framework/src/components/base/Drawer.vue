<script setup lang="ts">
import { ref, watch } from 'vue'
import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useColorPreference } from '@southneuhof/is-vue-framework/adapters/state'
import { DrawerContent, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTrigger } from 'vaul-vue'

const emit = defineEmits(['update:isOpen'])
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: false,
    default: false,
  },
  title: {
    type: String,
    required: false,
  },
  onClose: {
    type: Function,
    required: false,
    default: () => null,
  },
  onOpen: {
    type: Function,
    required: false,
    default: () => null,
  },
  disabled: {
    type: Boolean,
    required: false,
  },
})

const isOpen = ref(props.isOpen)

watch(
  () => props.isOpen,
  () => {
    isOpen.value = props.isOpen
  }
)

function closeDialog() {
  isOpen.value = false
  props.onClose()
}
function openDialog() {
  props.onOpen()
  isOpen.value = true
}

function setOpen(value: boolean) {
  isOpen.value = value
}

watch(isOpen, (val) => {
  emit('update:isOpen', val)
})
</script>

<template>
  <DrawerRoot :direction="'right'">
    <DrawerTrigger>
      <slot name="trigger" v-bind="openDialog"></slot>
    </DrawerTrigger>
    <DrawerPortal>
      <DrawerOverlay class="fixed inset-0 bg-black/40" />
      <DrawerContent direction class="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col rounded-l-[10px] bg-surface-container p-8 outline-none">
        <slot name="content" v-bind="{ setOpen }"></slot>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
  <!-- <div type="button" @click="disabled ? null : openDialog()">
    <slot name="trigger" v-bind="openDialog"></slot>
  </div>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeDialog" class="relative z-10" id="dialog" :class="useColorPreference().value">
      <TransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full p-4 text-center">
          <TransitionChild as="template" class="drawer-transition" enter="ease-out" enter-from="translate-y-full" enter-to="translate-y-0" leave="ease-in" leave-from="translate-y-0" leave-to="translate-y-full">
            <div class="fixed inset-0 overflow-y-auto">
              <div class="flex h-full w-full items-end justify-end">
                <DialogPanel class="w-full max-h-[85%] overflow-auto pb-8 transform rounded-3xl bg-surface-container p-6 text-left align-middle text-on-surface transition-all  ">
                  <div class="flex flex-col gap-4">
                    <DialogTitle as="h3" class="text-2xl">
                      <div class="flex w-full flex-col" :class="$slots.icon ? 'items-center justify-center gap-4' : ''">
                        <slot v-if="$slots.icon" name="icon"></slot>
                        <slot v-if="$slots.title" name="title" v-bind="{ closeDialog }"></slot>
                        <div v-else>{{ props.title }}</div>
                      </div>
                    </DialogTitle>
                    <div v-if="$slots.content" class="text-on-surface-variant ">
                      <slot name="content" v-bind="{ closeDialog }"></slot>
                    </div>

                    <div v-if="$slots.footer">
                      <div class="flex flex-row items-center justify-end gap-2">
                        <slot name="footer" v-bind="{ closeDialog }"></slot>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot> -->
</template>

<style scoped>
.drawer-transition {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
