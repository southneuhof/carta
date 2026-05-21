<script setup lang="ts">
import services from '@/utils/services'
import { ref, watch, type PropType } from 'vue'
import PathTree from './_layouts/PathTree.vue'
import PathDetail from './_layouts/PathDetail.vue'

const props = defineProps({
  multi: {
    type: Boolean,
    default: false,
  },
  pick: {
    type: Array as PropType<('file' | 'folder')[]>,
    default: () => ['file', 'folder'],
  },
  onSelectFile: {
    type: Function,
    default: () => {},
  },
  activePath: {
    type: String,
    default: () => '',
  },
  activeObject: {
    type: Object,
    default: () => null,
  },
})

const activePath = ref<any>({ path: props.activePath })

watch(
  () => props.activePath,
  () => {
    activePath.value = { ...activePath.value, path: props.activePath }
  }
)
</script>

<template>
  <div class="flex h-full flex-col">
    <Suspense :timeout="0">
      <template #fallback>
        <div class="flex h-full items-center justify-center">
          <Spinner />
        </div>
      </template>
      <div class="grid h-full grid-cols-6 overflow-hidden rounded-lg outline outline-1 outline-outline/[24%]">
        <div class="group/pathTree col-span-1 flex flex-col overflow-hidden rounded-l-lg border border-r border-r-outline/[24%] bg-surface-container">
          <div class="flex-1 overflow-y-auto px-2 py-4">
            <PathTree v-model="activePath" />
          </div>
        </div>

        <div class="col-span-5 flex flex-col overflow-hidden rounded-r-lg bg-surface-container">
          <Suspense :timeout="0">
            <template #fallback>
              <div class="flex items-center justify-center pt-8">
                <Spinner />
              </div>
            </template>
            <PathDetail v-if="activePath?.path" :activeObject="activeObject" v-model="activePath" :item="activePath" :onSelectFile="onSelectFile" :key="JSON.stringify(activePath)">
              <template v-if="$slots['footer']" #footer="{ data }">
                <slot name="footer" v-bind="{ data }" />
              </template>
            </PathDetail>
          </Suspense>
        </div>
      </div>
    </Suspense>
  </div>
</template>
