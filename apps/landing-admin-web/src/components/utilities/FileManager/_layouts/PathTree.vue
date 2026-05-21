<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ContextMenuContent, ContextMenuItem, ContextMenuPortal, ContextMenuTrigger, ContextMenuRoot } from 'radix-vue'

interface FolderItem {
  path: string
  // Add other properties that your folder items might have
  [key: string]: any
}

import services from '@/utils/services'
import ConfirmationModal from '@/components/composites/ConfirmationModal.vue'
import { toast } from 'vue-sonner'
import ModalForm from '@/components/composites/ModalForm.vue'

const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
})

const modelValue = defineModel<Record<string, any>>()

const isExpanded = ref(false)
const isLoading = ref(false)
const children = ref<FolderItem[]>([])

const loadChildren = async (event?: Event) => {
  if (event) {
    event.stopPropagation()
  }
  if (!isExpanded.value && children.value.length === 0) {
    await fetchChildren()
  }
  isExpanded.value = !isExpanded.value
}

async function fetchChildren() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const { data } = await services.get('files', { dir: props.item?.path || '', type: 'folder' })
    children.value = data || []
    console.log('children', children.value)
  } catch (error) {
    console.error('Error loading children:', error)
    children.value = []
  } finally {
    isLoading.value = false
  }
}

if (props.level === 0) {
  await fetchChildren()
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <template v-if="level > 0">
      <ContextMenuRoot>
        <ContextMenuTrigger as-child>
          <button
            class="overlay flex w-full min-w-fit flex-row items-center gap-2 rounded-sm px-2 py-0 after:hover:bg-on-info-container/[8%] after:active:bg-on-info-container/[12%]"
            :style="{ 'padding-left': `${(level - 1) * 16 + 8}px` }"
            @click="() => (modelValue = item)"
            :class="{ 'bg-info-container': modelValue === item }"
          >
            <div class="flex flex-row items-center">
              <div @click="loadChildren" class="group/expandIcon z-[10] cursor-default py-2 opacity-0 transition-opacity duration-1000 group-hover/pathTree:opacity-100">
                <Icon :name="isExpanded ? 'arrow-down-s' : 'arrow-right-s'" class="text-muted group-hover/expandIcon:text-on-surface"></Icon>
              </div>
              <Icon name="folder"></Icon>
            </div>
            <span class="path-name whitespace-nowrap text-start">{{ item.path?.split('/').pop() }}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <!-- <Transition name="fade"> -->
          <ContextMenuContent class="z-10 min-w-[220px] rounded-md border border-outline-variant bg-surface-container-high p-1 text-sm text-on-surface shadow-md">
            <ContextMenuItem @select.prevent>
              <ModalForm
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
                :extraData="{ dir: item.path }"
                targetAPI="create-folder?custom"
                :onSuccess="
                  () => {
                    toast.success('Folder created successfully')
                    fetchChildren()
                  }
                "
              >
                <template #trigger>
                  <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-on-surface/10">
                    <Icon name="add"></Icon>
                    <p>Buat Folder Baru</p>
                  </div>
                </template>
              </ModalForm>
            </ContextMenuItem>
            <ContextMenuItem @select.prevent>
              <ConfirmationModal
                class="w-full"
                :onConfirm="
                  () =>
                    services
                      .post('delete-file', { path: item.path })
                      .then(() => {
                        toast.success('File deleted successfully')
                        fetchChildren()
                      })
                      .catch(() => toast.error('Failed to delete file'))
                "
              >
                <template #trigger>
                  <div class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-error hover:bg-on-surface/10">
                    <Icon name="delete-bin"></Icon>
                    <p>Delete</p>
                  </div>
                </template>
              </ConfirmationModal>
            </ContextMenuItem>
          </ContextMenuContent>
          <!-- </Transition> -->
        </ContextMenuPortal>
      </ContextMenuRoot>
    </template>

    <div v-if="(level > 0 ? isExpanded : true) && children.length > 0" class="flex flex-col gap-0.5">
      <template v-if="isLoading">
        <div class="loading">Loading...</div>
      </template>
      <template v-else>
        <PathTree v-for="child in children" :key="child.path" :item="child" :level="level + 1" v-model="modelValue" />
      </template>
    </div>
  </div>
</template>
