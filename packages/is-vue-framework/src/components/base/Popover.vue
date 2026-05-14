<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref, type PropType } from 'vue'
import { PopoverArrow, PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue'

const props = defineProps({
  align: {
    type: String as PropType<'start' | 'center' | 'end'>,
    default: 'start',
  },
  alignOffset: {
    type: Number,
    default: 0,
  },
  sideOffset: {
    type: Number,
    default: 4,
  },
  side: {
    type: String as PropType<'top' | 'bottom' | 'left' | 'right'>,
    default: 'bottom',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const open = defineModel({ default: false })

function setOpen(value: boolean) {
  open.value = value
  console.log('set open', open.value)
}
</script>

<template>
  <slot v-if="disabled" name="trigger" v-bind="{ setOpen, disabled }"></slot>
  <PopoverRoot v-else v-model:open="open">
    <div class="flex grow">
      <PopoverTrigger class="block w-full min-w-0 max-w-full text-left">
        <slot name="trigger" v-bind="{ setOpen, disabled }"></slot>
      </PopoverTrigger>
    </div>
    <PopoverPortal>
      <PopoverContent
        :align="props.align"
        :alignOffset="props.alignOffset"
        :sideOffset="props.sideOffset"
        :side="props.side"
        class="z-[10] mx-2 w-full data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        @interact-outside="(event) => {
          const target = event.target as HTMLElement
          if (target?.closest('.dp__menu') || target?.closest('.dp__overlay')) {
            event.preventDefault()
          }
        }"
      >
        <slot name="content" v-bind="{ setOpen }"></slot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
