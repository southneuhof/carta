<script setup lang="ts">
import { defaultGetData } from '@southneuhof/is-vue-framework/behaviors/select'
import { ref, type PropType, watch, computed, type ComputedRef, onMounted } from 'vue'
import { commonProps } from './commonprops'
import BaseInput from './BaseInput.vue'
import Popover from '@southneuhof/is-vue-framework/components/base/Popover.vue'
import TextInput from '@southneuhof/is-vue-framework/components/inputs/TextInput.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  placeholder: {
    type: String,
    required: false,
    default: 'Pilih',
  },
  data: {
    type: Array as PropType<Array<Record<string, string>>>,
    required: false,
    default: [],
  },
  getAPI: {
    type: String,
    required: false,
    default: '',
  },
  searchParameters: {
    type: Object as PropType<Record<string, string>>,
    required: false,
    default: {},
  },
  getData: {
    type: Function as PropType<(getAPI: string, searchParameters: object) => Promise<Array<any>>>,
    required: false,
    default: defaultGetData,
  },
  defaultToFirst: {
    type: Boolean,
    required: false,
    default: false,
  },
  pick: {
    type: String,
    required: false,
    default: 'id',
  },
  view: {
    type: String,
    required: false,
    default: 'name',
  },
  multi: {
    type: Boolean,
    required: false,
    default: false,
  },
  searchable: {
    type: Boolean,
    required: false,
    default: true,
  },
  asWhole: {
    type: Boolean,
    required: false,
    default: false,
  },
  transform: {
    type: Object,
  },
  onSelect: {
    type: Function,
    default: () => {},
  },
  clearable: {
    type: Boolean,
    required: false,
    default: true,
  },
  ...commonProps,
})

const modelValue = defineModel<any[] | Record<string, string> | null | string>()
const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()

const loading = ref(true)
const data = ref<Array<any>>([])
const query = ref('')
const selected = ref<any[] | Record<string, string> | null>()

onMounted(() => {
  if (modelValue.value != null) return
  if (props.multi) {
    modelValue.value = []
    selected.value = []
  }
})

let displayValue: ComputedRef<string>
const filteredData = computed(() => {
  if (query.value) return data.value.filter((item: any) => item[props.view].toLowerCase().includes(query.value.toLowerCase()))
  else return data.value
})

function isSameValue(a: any, b: any) {
  if (a === b) return true
  if ((a == null && b === '') || (a === '' && b == null)) return true

  const aIsObject = a != null && typeof a === 'object'
  const bIsObject = b != null && typeof b === 'object'

  // For object values (asWhole mode), compare by picked key to avoid
  // false positives like String({}) === String({}) => "[object Object]".
  if (aIsObject || bIsObject) {
    const aPicked = aIsObject ? (a as any)?.[props.pick] : a
    const bPicked = bIsObject ? (b as any)?.[props.pick] : b
    return String(aPicked) === String(bPicked)
  }

  return String(a) === String(b)
}

const currentPicked = computed(() => {
  if (props.multi) return null
  if (props.asWhole && modelValue.value && typeof modelValue.value === 'object') {
    return (modelValue.value as any)[props.pick]
  }
  return modelValue.value as any
})

function pickSelected() {
  if (Array.isArray(modelValue.value)) {
    if (modelValue.value?.length)
      (selected.value as any[]) = data.value.filter((item: any) => (modelValue.value as any[]).find((modelItem: any) => String(modelItem[props.pick]) === String(item[props.pick])))
    else selected.value = props.defaultToFirst ? [data.value[0]] : []
  } else {
    if (modelValue.value) {
      if (props.asWhole && typeof modelValue.value === 'object') {
        selected.value = data.value.find((item: any) => String(item[props.pick]) === String((modelValue.value as any)?.[props.pick]))
      } else {
        selected.value = data.value.find((item: any) => String(item[props.pick]) === String(modelValue.value))
      }
    } else {
      selected.value = props.defaultToFirst ? data.value[0] : null
    }
  }
}

displayValue = computed(() => {
  if (props.multi) {
    if (selected.value?.length)
      return (
        (selected.value as any[])
          .slice(0, 2)
          .map((item) => item[props.view])
          .join(', ') + ((selected.value as any[]).length > 2 ? `, dan ${(selected.value as any[]).length - 2} lainnya` : '')
      )
    else return ''
  } else {
    if (selected.value != null) return (selected.value as any)[props.view]
    else return ''
  }
})

async function preflight() {
  if (props.getAPI) data.value = await props.getData(props.getAPI, props.searchParameters)
  else data.value = props.data
  if (props.transform) {
    const transformedData = JSON.parse(JSON.stringify(data.value))
    const entries = Object.entries(props.transform)
    transformedData.forEach((item: any) => {
      entries.forEach((entry) => {
        item[entry[1]] = item[entry[0]]
        delete item[entry[0]]
      })
    })
    data.value = transformedData
  }

  const hadValue = modelValue.value != null && (Array.isArray(modelValue.value) ? modelValue.value.length > 0 : true)
  pickSelected()
  loading.value = false

  // Only update modelValue if we're setting a default (no existing value) or if multi-select
  if (!hadValue || props.multi) {
    updateModelValue()
  }
}

function updateModelValue() {
  let nextValue: any

  if (props.multi && Array.isArray(modelValue.value)) {
    nextValue = (selected.value as any[])?.map((item: any) => {
      const correspondingValue = (modelValue.value as any[])?.find((mv) => mv[props.pick] === item[props.pick])
      if (correspondingValue) return correspondingValue
      else return item
    })
  } else {
    nextValue = props.asWhole ? (selected.value as any) : (selected.value as any)?.[props.pick]
  }

  if (props.multi) {
    const currentValue = Array.isArray(modelValue.value) ? modelValue.value : []
    const mappedCurrent = currentValue.map((item: any) => (typeof item === 'object' ? item?.[props.pick] : item))
    const mappedNext = Array.isArray(nextValue) ? nextValue.map((item: any) => (typeof item === 'object' ? item?.[props.pick] : item)) : []

    if (JSON.stringify(mappedCurrent) !== JSON.stringify(mappedNext)) {
      modelValue.value = nextValue
    }
  } else if (!isSameValue(modelValue.value, nextValue)) {
    modelValue.value = nextValue
  }

  props.onSelect(selected.value)
}

function handleItemClick(item: any, setOpen: Function) {
  if (item == null) {
    if (!props.multi) {
      selected.value = null
      setOpen(false)
    } else {
      selected.value = []
    }
    // updateModelValue()
    modelValue.value = null
    emit('validation:touch')
    return
  }
  if (!props.multi) {
    selected.value = item
    setOpen(false)
  } else {
    // Ensure selected is an array for multi-select
    const currentSelected = Array.isArray(selected.value) ? selected.value : []
    if (currentSelected.map((s: any) => s[props.pick]).includes(item[props.pick])) {
      selected.value = currentSelected.filter((selectedItem: any) => selectedItem[props.pick] !== item[props.pick])
    } else {
      selected.value = [...currentSelected, item]
    }
  }
  updateModelValue()
  emit('validation:touch')
}

preflight()

onMounted(() => {
  watch(modelValue, () => {
    pickSelected()
  })
})
</script>

<template>
  <BaseInput v-bind="props">
    <div class="w-full min-w-0 max-w-full">
      <Popover :class="$attrs.class" :disabled="disabled">
        <template #trigger>
          <div
            :key="`${String(displayValue)}`"
            :class="`flex w-full min-w-0 max-w-full flex-row items-center justify-between gap-2 overflow-hidden rounded-lg bg-surface-container px-4 py-2 outline outline-1 outline-outline/[24%] ${
              disabled ? 'pointer-events-none cursor-not-allowed !bg-surface-variant/50 ' : ''
            } ${$attrs.class || ''}`"
          >
            <p v-if="displayValue" class="min-w-0 max-w-full flex-1 truncate text-start">{{ displayValue }}</p>
            <p v-else class="text-muted">{{ placeholder }}</p>
            <Icon v-if="disabled || !modelValue || !clearable" name="arrow-down-s" />
            <button v-else-if="clearable" @click="() => handleItemClick(null, () => {})" class="flex items-center justify-center">
              <Icon name="close" />
            </button>
          </div>
        </template>
        <template #content="{ setOpen }">
          <Card variant="outlined" color="surfaceContainerHigh" :content-padding="0" class="max-h-80 max-w-screen-sm gap-1 shadow-sm">
            <div v-if="props.searchable" class="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-high p-4">
              <TextInput
                disable-helper-message
                :model-value="query"
                @update:model-value="(value) => (query = String(value))"
                placeholder="Cari..."
                icon="search"
              />
            </div>
            <div v-if="filteredData.length" class="h-full overflow-y-auto p-4">
              <Card
                v-for="item in filteredData"
                color="surfaceContainerHigh"
                class="flex flex-row items-center justify-between gap-4"
                style="padding: 8px 16px"
                @click="() => handleItemClick(item, setOpen)"
              >
                <div class="">{{ item[view] }}</div>
                <Icon v-if="multi && Array.isArray(modelValue)" :class="modelValue.map((item) => item[pick]).includes(item[pick]) ? 'opacity-100' : 'opacity-0'" name="check"></Icon>
                <Icon v-else :class="String(currentPicked) === String(item[pick]) ? 'opacity-100' : 'opacity-0'" name="check"></Icon>
              </Card>
            </div>
            <p v-else class="p-2 text-xs text-muted">Tidak ada data</p>
          </Card>
        </template>
      </Popover>
    </div>
  </BaseInput>
</template>
