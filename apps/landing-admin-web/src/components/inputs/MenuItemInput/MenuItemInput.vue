<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import MenuItemInputView from './MenuItemInputView.vue'
import services from '@/utils/services'
import BaseInput from '@southneuhof/is-vue-framework/components/inputs/BaseInput.vue'
import { commonProps } from '@southneuhof/is-vue-framework/components/inputs/commonprops'
import Dialog from '@southneuhof/is-vue-framework/components/base/Dialog.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { buildMenuPathFromSelectedItems, createEmptyMenuPathSelection, initializeMenuPathSelection } from './menuPath'

const modelValue = defineModel<string | undefined>() // Relative URL: /slug1/slug2/slug3 or undefined

const props = defineProps({
  ...commonProps
})

const isOpen = ref(false)

const selectedItems = ref<Array<{ id: string; slug: string; name: string } | undefined>>(createEmptyMenuPathSelection().selectedItems)
const currentSelectedIds = ref<Array<string | undefined>>(createEmptyMenuPathSelection().currentSelectedIds)
const isLoadingInitialPath = ref(false)

const pathPreview = computed(() => {
  return selectedItems.value
    .filter((item) => item && item.slug)
    .map((item) => item!.slug)
    .join('/')
})

const displayValue = computed(() => {
  if (isLoadingInitialPath.value) {
    return 'Loading path...'
  }
  if (modelValue.value) {
    return modelValue.value
  }
  return `Pilih menu`
})

async function initializeFromModelValue(path: string | undefined) {
  isLoadingInitialPath.value = true
  try {
    const selection = await initializeMenuPathSelection(path, async (params) => {
      const { data } = await services.list('menuItem', { ...params, limit: 999, order_by: 'display_order', order_direction: 'asc' })
      return data || []
    })
    selectedItems.value = selection.selectedItems
    currentSelectedIds.value = selection.currentSelectedIds
  } catch (error) {
    console.error('Error initializing MenuItemInput from modelValue:', error)
    const empty = createEmptyMenuPathSelection()
    selectedItems.value = empty.selectedItems
    currentSelectedIds.value = empty.currentSelectedIds
  }
  isLoadingInitialPath.value = false
}

watch(
  modelValue,
  (newPath, oldPath) => {
    // Initialize if the modal is not open and path has changed,
    // or if it's the first load (oldPath is undefined)
    if (!isOpen.value && newPath !== oldPath) {
      initializeFromModelValue(newPath)
    }
  },
  { immediate: true }
)

function handleItemSelected(itemSelection: { id: string; slug: string; name: string; level: number }) {
  const levelIndex = itemSelection.level - 1 // 0, 1, or 2
  if (levelIndex < 0 || levelIndex > 2) return

  selectedItems.value[levelIndex] = { id: itemSelection.id, slug: itemSelection.slug, name: itemSelection.name }
  // currentSelectedIds[levelIndex] is already updated by v-model on MenuItemInputView

  // Clear selections for subsequent levels
  for (let i = levelIndex + 1; i < 3; i++) {
    selectedItems.value[i] = undefined
    currentSelectedIds.value[i] = undefined // This will also clear selection in child MenuItemInputView
  }
  selectedItems.value = [...selectedItems.value]
  currentSelectedIds.value = [...currentSelectedIds.value]
}

function confirmSelection(setOpen: Function) {
  modelValue.value = buildMenuPathFromSelectedItems(selectedItems.value)
  isOpen.value = false
}

function clearSelection() {
  const empty = createEmptyMenuPathSelection()
  selectedItems.value = empty.selectedItems
  currentSelectedIds.value = empty.currentSelectedIds
  selectedItems.value = [...selectedItems.value]
  currentSelectedIds.value = [...currentSelectedIds.value]
}

function openModal() {
  // Prevent opening if disabled
  if (props.disabled) return;
  // Re-initialize from modelValue when modal opens to ensure it reflects the current state
  initializeFromModelValue(modelValue.value)
  isOpen.value = true
}

function handleModalClose() {
  isOpen.value = false
  // Optionally, if you want to revert selections if modal is cancelled without confirming:
  // initializeFromModelValue(modelValue.value);
}
</script>

<template>
  <BaseInput v-bind="props" :error="error" class="menu-item-input w-full">
    <Dialog :open="isOpen" @update:open="isOpen = $event">
      <template #trigger>
        <div
          class="rounded-lg px-4 py-2 bg-surface-container-high flex flex-row gap-2 items-center justify-between cursor-pointer overlay after:hover:bg-primary/10"
          :class="props.disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''"
          @click="openModal"
        >
          <p v-if="displayValue" class="min-w-max">{{ displayValue }}</p>
          <p v-else class="text-muted">Pilih Menu</p>
          <Icon v-if="!modelValue" name="arrow-down-s"></Icon>
        </div>
        <!-- <Button @click="openModal" variant="outlined" class="min-h-[40px] w-full justify-start px-3 py-2 text-left">
          <span class="truncate">{{ displayValue }}</span>
        </Button> -->
      </template>
      <template #content="{ setOpen }">
        <div class="flex flex-col gap-4 p-1">
          <p>
            Path: <span class="font-semibold">{{ pathPreview ? `/${pathPreview}` : 'None selected' }}</span>
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-muted">Level 1</p>
              <MenuItemInputView :level="1" v-model:selectedId="currentSelectedIds[0]" @item-selected="handleItemSelected" />
            </div>

            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-muted">Level 2</p>
              <template v-if="currentSelectedIds[0]">
                <MenuItemInputView :level="2" :parent-id="currentSelectedIds[0]" v-model:selectedId="currentSelectedIds[1]" @item-selected="handleItemSelected" />
              </template>
              <p v-else class="text-muted">Select an item from Level 1 to see options.</p>
            </div>

            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-muted">Level 3</p>
              <template v-if="currentSelectedIds[1]">
                <MenuItemInputView :level="3" :parent-id="currentSelectedIds[1]" v-model:selectedId="currentSelectedIds[2]" @item-selected="handleItemSelected" />
              </template>
              <p v-else class="text-muted">Select an item from Level 2 to see options.</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <Button
              variant="outlined"
              @click="
                () => {
                  handleModalClose()
                }
              "
              >Cancel</Button
            >
            <Button variant="tonal" color="primary" @click="clearSelection">Clear Current Selections</Button>
            <Button @click="confirmSelection(setOpen)">Confirm Selection</Button>
          </div>
        </div>
      </template>
    </Dialog>
  </BaseInput>
</template>

<style scoped>
/* Add any specific styles if needed */
.menu-item-input .min-h-\[40px\] {
  /* Ensure button has a decent height */
  min-height: 40px;
}
</style>
