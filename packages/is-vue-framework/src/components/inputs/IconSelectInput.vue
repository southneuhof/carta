<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useVirtualList } from '@vueuse/core'
import BaseInput from './BaseInput.vue'
import { commonProps } from './commonprops'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import { Dialog, DialogContent } from '@southneuhof/is-vue-framework/components/base/Dialog/index'
import { extractRemixiconClassNamesFromStyleSheets, filterRemixiconClassNames, normalizeRemixiconClass, toIconRows } from './iconSelect.utils'

const GRID_COLUMNS = 6
const ROW_HEIGHT = 56

const props = defineProps({
  ...commonProps,
})

const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

const modelValue = defineModel<string>()

const open = ref(false)
const query = ref('')
const allIcons = ref<string[]>([])
const loadingIcons = ref(false)

const selectedClass = computed(() => normalizeRemixiconClass(modelValue.value))
const filteredIcons = computed(() => filterRemixiconClassNames(allIcons.value, query.value))
const iconRows = computed(() => toIconRows(filteredIcons.value, GRID_COLUMNS))

const { list: virtualRows, containerProps, wrapperProps } = useVirtualList(iconRows, {
  itemHeight: ROW_HEIGHT,
  overscan: 8,
})

function pickIcon(iconClass: string) {
  modelValue.value = iconClass
  emit('validation:touch')
  open.value = false
}

function clearSelection() {
  modelValue.value = ''
  emit('validation:touch')
}

function loadIconsFromStylesheets() {
  loadingIcons.value = true
  allIcons.value = extractRemixiconClassNamesFromStyleSheets(Array.from(document.styleSheets) as CSSStyleSheet[])
  loadingIcons.value = false
}

function openPicker() {
  if (props.disabled) return
  open.value = true
  if (!allIcons.value.length) {
    loadIconsFromStylesheets()
  }
}

onMounted(() => {
  // Keep extraction lazy by default; this ensures document is available and avoids SSR access.
})
</script>

<template>
  <BaseInput v-bind="props">
    <div class="flex w-full flex-col gap-2">
      <button
        type="button"
        :disabled="disabled"
        @click="openPicker"
        :class="`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg bg-surface-container px-3 py-2 text-left outline outline-1 outline-outline/[24%] ${
          disabled ? 'cursor-not-allowed bg-surface-variant/50 text-on-surface/[38%]' : ''
        }`"
      >
        <div class="flex min-w-0 items-center gap-3">
          <i v-if="selectedClass" :class="selectedClass" class="text-xl"></i>
          <p v-else class="text-muted">Pilih icon...</p>
          <p v-if="selectedClass" class="truncate text-sm">{{ selectedClass }}</p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="selectedClass"
            kind="icon"
            variant="standard"
            type="button"
            aria-label="Clear icon"
            :disabled="disabled"
            @click.stop="clearSelection"
          >
            <template #icon>
              <i class="ri-close-line text-lg"></i>
            </template>
          </Button>
          <i class="ri-arrow-down-s-line text-xl"></i>
        </div>
      </button>

      <Dialog v-model:open="open">
        <DialogContent class="flex h-[70vh] max-w-[860px] flex-col">
          <div class="flex items-center gap-3 border-b border-outline-variant pb-4">
            <input
              v-model="query"
              type="text"
              placeholder="Cari icon..."
              class="w-full rounded-lg bg-surface-container px-3 py-2 text-sm outline outline-1 outline-outline/[24%]"
            />
            <Button type="button" variant="outlined" @click="clearSelection" :disabled="disabled || !selectedClass">Clear</Button>
          </div>

          <div v-if="loadingIcons" class="flex h-full items-center justify-center text-sm text-muted">
            Memuat icon...
          </div>

          <div v-else-if="!filteredIcons.length" class="flex h-full items-center justify-center text-sm text-muted">
            Icon tidak ditemukan.
          </div>

          <div
            v-else
            v-bind="containerProps"
            class="h-full overflow-y-auto"
          >
            <div v-bind="wrapperProps">
              <div
                v-for="row in virtualRows"
                :key="row.index"
                class="grid grid-cols-6 gap-2 px-1 py-1"
                :style="{ height: `${ROW_HEIGHT}px` }"
              >
                <button
                  v-for="iconClass in row.data"
                  :key="iconClass"
                  type="button"
                  :aria-label="iconClass"
                  :title="iconClass"
                  @click="pickIcon(iconClass)"
                  :class="`flex h-12 flex-col items-center justify-center rounded-lg border px-2 text-center transition-colors ${
                    selectedClass === iconClass
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline/[24%] bg-surface-container hover:bg-surface-container-high'
                  }`"
                >
                  <i :class="iconClass" class="text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </BaseInput>
</template>
