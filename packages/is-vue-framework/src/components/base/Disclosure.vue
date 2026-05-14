<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ref, watch } from 'vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  open: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const panelState = ref(props.open)

watch(
  () => props.open,
  (value: boolean) => {
    panelState.value = value
  }
)
</script>

<template>
  <div class="w-full">
    <Disclosure v-slot="{ open }">
      <DisclosureButton @click="panelState = !panelState" class="w-full">
        <div
          :class="panelState ? 'bg-secondary-container text-on-secondary-container  ' : 'bg-surface-container-high text-on-surface  '"
          class="overlay flex w-full flex-row items-center justify-between rounded-xl px-4 py-2 after:bg-on-surface/[8%] after:active:bg-on-surface/[12%]"
        >
          <div class="flex flex-col">
            <div class="text-start">{{ props.title }}</div>
            <div v-if="props.description" class="text-start text-sm">{{ props.description }}</div>
          </div>
          <Icon size="3xl" :name="!panelState ? 'arrow-down-s' : 'arrow-up-s'" />
        </div>
      </DisclosureButton>
      <div v-show="panelState">
        <DisclosurePanel static>
          <slot></slot>
        </DisclosurePanel>
      </div>
    </Disclosure>
  </div>
</template>
