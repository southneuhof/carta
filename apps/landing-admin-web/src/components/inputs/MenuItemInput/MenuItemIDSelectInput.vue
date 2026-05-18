<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import MenuItemInputView from './MenuItemInputView.vue'
import services from '@/utils/services'
import BaseInput from '@southneuhof/is-vue-framework/components/inputs/BaseInput.vue'
import { commonProps } from '@southneuhof/is-vue-framework/components/inputs/commonprops'
import Dialog from '@southneuhof/is-vue-framework/components/base/Dialog.vue'

const modelValue = defineModel<string | undefined>() // Menu item ID instead of path

const props = defineProps({
  ...commonProps,
  onConfirm: {
    type: Function as PropType<(id: string | undefined) => Promise<void>>,
    default: () => {}
  }
})

const isOpen = ref(false)

// Stores {id, slug, name} for selected items at each level
const selectedItems = ref<Array<{ id: string; slug: string; name: string } | undefined>>([undefined, undefined, undefined])
// Stores just the ID for v-model:selectedId binding with MenuItemInputView
const currentSelectedIds = ref<Array<string | undefined>>([undefined, undefined, undefined])
const isLoadingInitialPath = ref(false)

const selectedItemName = computed(() => {
  // Find the last selected item and return its name
  for (let i = selectedItems.value.length - 1; i >= 0; i--) {
    if (selectedItems.value[i]) {
      return selectedItems.value[i]!.name
    }
  }
  return undefined
})

const displayValue = computed(() => {
  if (isLoadingInitialPath.value) {
    return 'Loading menu item...'
  }
  if (selectedItemName.value) {
    return selectedItemName.value
  }
  return `Pilih Menu`
})

async function initializeFromModelValue(id: string | undefined) {
  isLoadingInitialPath.value = true
  let newSelectedItems: Array<{ id: string; slug: string; name: string } | undefined> = [undefined, undefined, undefined]
  let newCurrentSelectedIds: Array<string | undefined> = [undefined, undefined, undefined]

  if (id) {
    try {
      // Fetch the menu item details
      const { data: menuItem } = await services.detail('menuItem', id)
      if (menuItem) {
        // Build the path from the menu item's ancestors
        const pathParts: Array<{ id: string; slug: string; name: string }> = []
        
        // Start with the current item
        pathParts.unshift({
          id: menuItem.id,
          slug: menuItem.slug,
          name: menuItem.translations?.find((t: any) => t.language === 'id')?.name || menuItem.name
        })

        // Get ancestors if they exist
        let currentItem = menuItem
        let level = menuItem.level
        
        while (level > 1 && currentItem.parent_id) {
          const { data: parentItem } = await services.detail('menuItem', currentItem.parent_id)
          if (parentItem) {
            pathParts.unshift({
              id: parentItem.id,
              slug: parentItem.slug,
              name: parentItem.translations?.find((t: any) => t.language === 'id')?.name || parentItem.name
            })
            currentItem = parentItem
            level = parentItem.level
          } else {
            break
          }
        }

        // Fill the selected items array
        for (let i = 0; i < Math.min(pathParts.length, 3); i++) {
          newSelectedItems[i] = pathParts[i]
          newCurrentSelectedIds[i] = pathParts[i].id
        }
      }
    } catch (error) {
      console.error('Error initializing MenuItemIDSelectInput from modelValue:', error)
      // Reset to empty if error occurs
      newSelectedItems = [undefined, undefined, undefined]
      newCurrentSelectedIds = [undefined, undefined, undefined]
    }
  }

  selectedItems.value = newSelectedItems
  currentSelectedIds.value = newCurrentSelectedIds
  isLoadingInitialPath.value = false
}

watch(
  modelValue,
  (newId, oldId) => {
    // Initialize if the modal is not open and id has changed,
    // or if it's the first load (oldId is undefined)
    if (!isOpen.value && newId !== oldId) {
      initializeFromModelValue(newId)
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

const loading = ref(false)

async function confirmSelection(setOpen: Function) {
  // Find the last selected item's ID
  let selectedId: string | undefined = undefined
  for (let i = selectedItems.value.length - 1; i >= 0; i--) {
    if (selectedItems.value[i]) {
      selectedId = selectedItems.value[i]!.id
      break
    }
  }
  loading.value = true
  try {
    await props.onConfirm(selectedId)
    modelValue.value = selectedId
    isOpen.value = false
    setOpen(false)
  } catch {

  } finally {
    loading.value = false
  }
}

function clearSelection() {
  selectedItems.value = [undefined, undefined, undefined]
  currentSelectedIds.value = [undefined, undefined, undefined]
}

function openModal() {
  // Re-initialize from modelValue when modal opens to ensure it reflects the current state
  initializeFromModelValue(modelValue.value)
  isOpen.value = true
}

function handleModalClose() {
  isOpen.value = false
}
</script>

<template>
  <BaseInput v-bind="props" :error="error" class="menu-item-input" :enable-helper-message="false">
    <Dialog :open="isOpen" @update:open="isOpen = $event">
      <template #trigger>
        <slot v-if="$slots['trigger']" name="trigger"/>
        <div v-else class="rounded-lg px-4 py-2 bg-surface-container-high flex flex-row gap-2 items-center justify-between cursor-pointer overlay after:hover:bg-primary/10">
          <p v-if="displayValue" class="min-w-max">{{ displayValue }}</p>
          <p v-else class="text-muted">Pilih Menu</p>
          <Icon v-if="!modelValue" name="arrow-down-s"></Icon>
        </div>
      </template>
      <template #content="{ setOpen }">
        <div class="flex flex-col gap-4 p-1">
          <p>
            Selected: <span class="font-semibold">{{ selectedItemName || 'None selected' }}</span>
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
            <Button @click="() => confirmSelection(setOpen)" :disabled="loading">Confirm Selection</Button>
          </div>
        </div>
      </template>
    </Dialog>
  </BaseInput>
</template>

<style scoped>
.menu-item-input .min-h-\[40px\] {
  min-height: 40px;
}
</style>