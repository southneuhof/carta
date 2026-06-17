<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { twMerge } from 'tailwind-merge'
import BaseInput from '@southneuhof/is-vue-framework/components/inputs/BaseInput.vue'
import { commonProps } from '@southneuhof/is-vue-framework/components/inputs/commonprops'
import Dialog from '@southneuhof/is-vue-framework/components/base/Dialog.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import MenuItemInputView from '../MenuItemInput/MenuItemInputView.vue'
import services from '@/utils/services'
import { buildMenuPathFromSelectedItems, createEmptyMenuPathSelection, initializeMenuPathSelection, isInternalWebsitePath, type MenuPathItem } from '../MenuItemInput/menuPath'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Input URL atau pilih menu',
  },
  pickerTitle: {
    type: String,
    default: 'Pilih Menu',
  },
  ...commonProps,
})

const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

const modelValue = defineModel<string | undefined>()

const isOpen = ref(false)
const isLoadingInitialPath = ref(false)
const inputValue = ref(modelValue.value ?? '')
const selectedItems = ref<Array<MenuPathItem | undefined>>(createEmptyMenuPathSelection().selectedItems)
const currentSelectedIds = ref<Array<string | undefined>>(createEmptyMenuPathSelection().currentSelectedIds)

const pathPreview = computed(() => {
  const selectedPath = buildMenuPathFromSelectedItems(selectedItems.value)
  return selectedPath || 'None selected'
})

function touchValidation() {
  emit('validation:touch')
}

async function initializePickerSelection(path: string | undefined) {
  isLoadingInitialPath.value = true

  try {
    const selection = await initializeMenuPathSelection(path, async (params) => {
      const { data } = await services.list('menuItem', { ...params, limit: 999, order_by: 'display_order', order_direction: 'asc' })
      return (data || []).filter((item: any) => item?.menu_item_type === 'page' && item?.slug)
    })
    selectedItems.value = selection.selectedItems
    currentSelectedIds.value = selection.currentSelectedIds
  } catch (error) {
    console.error('Error initializing URLInput picker selection:', error)
    const empty = createEmptyMenuPathSelection()
    selectedItems.value = empty.selectedItems
    currentSelectedIds.value = empty.currentSelectedIds
  } finally {
    isLoadingInitialPath.value = false
  }
}

function handleTextInput(event: Event) {
  const nextValue = (event.target as HTMLInputElement).value
  inputValue.value = nextValue
  modelValue.value = nextValue || undefined
  touchValidation()
}

function handleItemSelected(itemSelection: { id: string; slug: string; name: string; level: number }) {
  const levelIndex = itemSelection.level - 1
  if (levelIndex < 0 || levelIndex > 2) return

  selectedItems.value[levelIndex] = { id: itemSelection.id, slug: itemSelection.slug, name: itemSelection.name }
  for (let index = levelIndex + 1; index < 3; index += 1) {
    selectedItems.value[index] = undefined
    currentSelectedIds.value[index] = undefined
  }
  selectedItems.value = [...selectedItems.value]
  currentSelectedIds.value = [...currentSelectedIds.value]
}

function openPicker() {
  if (props.disabled) return
  void initializePickerSelection(modelValue.value)
  isOpen.value = true
}

function confirmSelection(setOpen: (value: boolean) => void) {
  const selectedPath = buildMenuPathFromSelectedItems(selectedItems.value)
  inputValue.value = selectedPath || ''
  modelValue.value = selectedPath
  touchValidation()
  isOpen.value = false
  setOpen(false)
}

function clearPickerSelection() {
  const empty = createEmptyMenuPathSelection()
  selectedItems.value = empty.selectedItems
  currentSelectedIds.value = empty.currentSelectedIds
}

function clearUrlValue() {
  clearPickerSelection()
  inputValue.value = ''
  modelValue.value = undefined
  touchValidation()
}

watch(
  () => modelValue.value,
  (value) => {
    const nextValue = value ?? ''
    if (inputValue.value !== nextValue) inputValue.value = nextValue
    if (!isOpen.value && isInternalWebsitePath(value)) void initializePickerSelection(value)
    if (!isOpen.value && !isInternalWebsitePath(value)) clearPickerSelection()
  },
  { immediate: true },
)
</script>

<template>
  <BaseInput v-bind="props">
    <Dialog :open="isOpen" @update:open="isOpen = $event">
      <template #trigger>
        <div
          :class="
            twMerge(
              `flex flex-row items-center gap-2 rounded-lg py-3 pl-4 outline outline-1 outline-outline/[24%] transition-all ease-linear focus-within:outline-2 ${
                error ? 'outline-error' : ''
              } ${disabled ? 'pointer-events-none cursor-not-allowed !bg-surface-variant/50 ' : ''}`,
              ($attrs.class as string),
            )
          "
        >
          <input
            :value="inputValue"
            :placeholder="placeholder"
            class="w-full bg-transparent focus-visible:outline-none"
            :disabled="disabled"
            data-testid="url-input-field"
            @click.stop
            @input="handleTextInput"
          />
          <button
            type="button"
            class="mr-3 flex flex-none items-center justify-center rounded-md p-1 text-on-surface/[67%] transition-colors hover:bg-primary/10 hover:text-primary"
            :disabled="disabled"
            data-testid="url-picker-trigger"
            @click.stop="openPicker"
          >
            <Icon name="pages" />
          </button>
        </div>
      </template>
      <template #title>
        {{ pickerTitle }}
      </template>
      <template #content="{ setOpen }">
        <div class="flex flex-col gap-4">
          <p v-if="isLoadingInitialPath" class="text-sm text-muted">Loading current path...</p>
          <p v-else>
            Path:
            <span class="font-semibold">{{ pathPreview }}</span>
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-muted">Level 1</p>
              <MenuItemInputView
                :level="1"
                :selected-id="currentSelectedIds[0]"
                :allowed-menu-item-types="['page']"
                :require-slug="true"
                @update:selectedId="currentSelectedIds[0] = $event"
                @item-selected="handleItemSelected"
              />
            </div>

            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-muted">Level 2</p>
              <template v-if="currentSelectedIds[0]">
                <MenuItemInputView
                  :level="2"
                  :parent-id="currentSelectedIds[0]"
                  :selected-id="currentSelectedIds[1]"
                  :allowed-menu-item-types="['page']"
                  :require-slug="true"
                  @update:selectedId="currentSelectedIds[1] = $event"
                  @item-selected="handleItemSelected"
                />
              </template>
              <p v-else class="text-muted">Select an item from Level 1 to see options.</p>
            </div>

            <div class="flex flex-col gap-2">
              <p class="text-sm font-semibold text-muted">Level 3</p>
              <template v-if="currentSelectedIds[1]">
                <MenuItemInputView
                  :level="3"
                  :parent-id="currentSelectedIds[1]"
                  :selected-id="currentSelectedIds[2]"
                  :allowed-menu-item-types="['page']"
                  :require-slug="true"
                  @update:selectedId="currentSelectedIds[2] = $event"
                  @item-selected="handleItemSelected"
                />
              </template>
              <p v-else class="text-muted">Select an item from Level 2 to see options.</p>
            </div>
          </div>

          <div class="mt-4 flex justify-end gap-3">
            <Button variant="outlined" data-testid="url-picker-cancel" @click="setOpen(false)">Cancel</Button>
            <Button
              variant="tonal"
              color="primary"
              data-testid="url-picker-clear"
              @click="clearUrlValue"
            >
              Clear URL
            </Button>
            <Button data-testid="url-picker-confirm" @click="confirmSelection(setOpen)">Pilih Menu</Button>
          </div>
        </div>
      </template>
    </Dialog>
  </BaseInput>
</template>
