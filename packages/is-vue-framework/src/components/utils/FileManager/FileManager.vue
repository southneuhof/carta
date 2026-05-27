<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import PathTree from './_layouts/PathTree.vue'
import PathDetail from './_layouts/PathDetail.vue'
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuRoot, ContextMenuTrigger } from 'radix-vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { toast } from 'vue-sonner'
import { getFrameworkBehaviors, missingBehavior } from '@southneuhof/is-vue-framework/adapters/behaviors'

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

const DEFAULT_ACCESSIBLE_PATH = '/storage/public'

function resolveActivePath(path?: string) {
  return path && path.trim() ? path : DEFAULT_ACCESSIBLE_PATH
}

const activePath = ref<any>({ path: resolveActivePath(props.activePath) })
const treeRenderKey = ref(0)

async function createFolder(payload: Record<string, any>) {
  const behavior = getFrameworkBehaviors().fileManager?.createFolder
  if (!behavior) missingBehavior('fileManager.createFolder')
  return behavior(payload.dir, payload.folder_name)
}

watch(
  () => props.activePath,
  () => {
    activePath.value = { ...activePath.value, path: resolveActivePath(props.activePath) }
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
          <ContextMenuRoot>
            <ContextMenuTrigger as-child>
              <div class="flex-1 overflow-y-auto px-2 py-4">
                <PathTree :key="treeRenderKey" v-model="activePath" />
              </div>
            </ContextMenuTrigger>
            <ContextMenuPortal>
              <ContextMenuContent class="z-10 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
                <ContextMenuItem @select.prevent>
                  <DialogForm
                    :fields="['folder_name']"
                    :fieldsAlias="{ folder_name: 'Nama Folder' }"
                    :inputConfig="{
                      folder_name: {
                        type: 'text',
                        props: {
                          required: true,
                        },
                      },
                    }"
                    class="w-full"
                    :extraData="{ dir: '/storage/public' }"
                    :onSubmit="({ payload }) => createFolder(payload)"
                    :onSuccess="
                      () => {
                        toast.success('Folder created successfully')
                        treeRenderKey += 1
                      }
                    "
                  >
                    <template #trigger>
                      <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10">
                        <Icon name="add"></Icon>
                        <p>Buat Folder Baru</p>
                      </div>
                    </template>
                  </DialogForm>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenuPortal>
          </ContextMenuRoot>
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
