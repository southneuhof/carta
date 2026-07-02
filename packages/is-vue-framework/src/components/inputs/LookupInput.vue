<script setup lang="ts">
import { defaultGetData, defaultGetDetail, defaultFieldsAlias, defaultDataFormatter } from '@southneuhof/is-vue-framework/behaviors/lookup'
import { ref, type PropType, watch, computed, onMounted } from 'vue'
import { commonProps } from './commonprops'
import Radio from './Radio.vue'
import BaseInput from './BaseInput.vue'
import Table from '../composites/Table.vue'
import Checkbox from './CheckboxInput.vue'
import SearchBox from '../composites/SearchBox.vue'
import DialogForm from '../composites/DialogForm.vue'
import ConfirmationDialog from '../composites/ConfirmationDialog.vue'
import Dialog from '../base/Dialog.vue'
import Popover from '../base/Popover.vue'
import Form from '../composites/Form.vue'
import { keyManager } from '@southneuhof/is-vue-framework/adapters/state'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Chip from '@southneuhof/is-vue-framework/components/base/Chip.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  ...commonProps,
  getData: {
    type: Function as PropType<(getAPI: string, searchParameters?: object) => Promise<any>>,
    default: defaultGetData,
  },
  getDetail: {
    type: Function as PropType<(getAPI: string, id: string | number, searchParameters?: object) => Promise<any>>,
    default: defaultGetDetail,
  },
  getAPI: {
    type: String,
    required: true,
  },
  showAPI: {
    type: String,
    required: false,
    default: '',
  },
  paginated: {
    type: Boolean,
    default: true,
  },
  searchParameters: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  multi: {
    type: Boolean,
    default: false,
  },
  pick: {
    type: String,
    default: 'id',
  },
  transform: {
    type: Object,
  },
  fields: {
    type: Array<string>,
    default: ['name'],
  },
  fieldsAlias: {
    type: Object,
    default: defaultFieldsAlias,
  },
  preview: {
    type: String,
  },
  placeholder: {
    type: String,
    default: 'Pilih',
  },
  fieldsType: {
    type: Object,
  },
  fieldsProxy: {
    type: Object,
  },
  fieldsDictionary: {
    type: Object,
  },
  fieldsParse: {
    type: Object,
  },
  filterConfig: {
    type: Object,
  },
  dataFormatter: {
    type: Function,
    default: defaultDataFormatter,
  },
  inlineAddFormConfig: {
    type: Object,
  },
  // `static=true` means manual commit mode:
  // selection updates are staged and only committed when user clicks "Simpan".
  // `static=false` keeps the existing save flow but still uses the same commit pipeline.
  static: {
    type: Boolean,
    default: false,
  },
  onCommit: {
    type: Function as PropType<(data: any) => any>,
    default: () => {},
  },
  formDataSetter: {
    type: Function as PropType<(newData: any) => void>,
    default: () => {},
  },
  hidePreviewTable: {
    type: Boolean,
  },
  formData: { type: Object },
  onSelectData: { type: Function as PropType<(formData: any, selectedData: any, formDataSetter: (newData: any) => void) => void> },
})

const modelValue = defineModel<any>()
const emit = defineEmits<{
  (event: 'validation:touch'): void
}>()
const inputValue = ref<Array<Record<string, any>>>([])
const stagedInputValue = ref<Array<Record<string, any>>>([])
const committedInputValue = ref<Array<Record<string, any>>>([])
const hasChanged = ref(false)
const isLoading = ref<boolean>(false)

const params = ref({
  page: 1,
  sort_by: '',
  sort: 'DESC',
  search: '',
  ...props.searchParameters,
})

const filterParameters = ref<Record<string, any>>({ ...props.searchParameters })

const combinedSearchParameters = computed(() => ({
  ...params.value,
  ...filterParameters.value,
}))

const filterProps = computed<Record<string, any>>(() => ({
  fields: props.filterConfig?.fields || [],
  fieldsAlias: props.filterConfig?.fieldsAlias || {},
  inputConfig: props.filterConfig?.inputConfig || {},
}))

function deepClone<T>(value: T): T {
  if (value == null) return value
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    if (Array.isArray(value)) return [...value] as T
    if (typeof value === 'object') return { ...(value as Record<string, any>) } as T
    return value
  }
}

function isDeepEqual(valueA: unknown, valueB: unknown) {
  if (valueA === valueB) return true
  try {
    return JSON.stringify(valueA) === JSON.stringify(valueB)
  } catch {
    return false
  }
}

function normalizeModelSelection(rawValue: any) {
  if (rawValue == null) return []

  if (props.multi) {
    if (!Array.isArray(rawValue) || rawValue.length === 0) return []
    return deepClone(rawValue)
  }

  if (typeof rawValue === 'object') {
    return [deepClone(rawValue)]
  }

  return [{ [props.pick]: rawValue }]
}

function syncSelection(selection: Array<Record<string, any>>, options?: { staged?: boolean; committed?: boolean }) {
  inputValue.value = deepClone(selection)
  if (options?.staged !== false) stagedInputValue.value = deepClone(selection)
  if (options?.committed !== false) committedInputValue.value = deepClone(selection)
}

function syncFromModelValue() {
  const normalizedSelection = normalizeModelSelection(modelValue.value)
  syncSelection(normalizedSelection)
}

function formatSelectionForModel(selection: Array<Record<string, any>>) {
  let data = selection
  if (props.transform && selection.length) {
    const transformedData = deepClone(selection)
    const entries = Object.entries(props.transform)
    transformedData.forEach((item: any) => {
      entries.forEach(([sourceKey, targetKey]) => {
        item[targetKey] = item[sourceKey]
      })
    })
    data = transformedData
  }
  if (!data.length) return props.multi ? [] : null
  return props.dataFormatter(data, props.multi, props.pick, props.fields)
}

function syncModelAndSelectHook(selection: Array<Record<string, any>>) {
  modelValue.value = formatSelectionForModel(selection)
  if (props.onSelectData) {
    props.onSelectData(props.formData, selection, props.formDataSetter)
  }
}

async function hydrateSingleSelectedData() {
  if (props.multi) return
  const selectedItem = inputValue.value?.[0]
  if (!selectedItem) return
  if (selectedItem[props.fields[0]]) return

  const selectedId = selectedItem[props.pick]
  if (selectedId == null || selectedId === '') return

  try {
    const detailData = await props.getDetail(props.getAPI, selectedId, props.searchParameters)
    if (!detailData) return

    syncSelection([deepClone(detailData)])
  } catch {
    // Ignore detail hydrate failure and keep fallback display state.
  }
}

async function commitFromSelection(selection: Array<Record<string, any>>) {
  const nextSelection = deepClone(selection)
  committedInputValue.value = deepClone(nextSelection)
  inputValue.value = deepClone(nextSelection)
  isLoading.value = true
  try {
    await props.onCommit(nextSelection)
    syncModelAndSelectHook(nextSelection)
    emit('validation:touch')
  } finally {
    isLoading.value = false
  }
}

function saveSelection() {
  // `static=true` and `static=false` both commit from staged selection.
  // This keeps the save action deterministic and avoids stale-commit bugs.
  return commitFromSelection(stagedInputValue.value)
}

function nonStaticCommit() {
  return saveSelection()
}

function resetStagedInputValue() {
  stagedInputValue.value = deepClone(committedInputValue.value)
}

onMounted(() => {
  syncFromModelValue()
  hydrateSingleSelectedData()
})

watch(
  () => modelValue.value,
  async (newVal, oldVal) => {
    if (isDeepEqual(newVal, oldVal)) return
    if (isDeepEqual(newVal, formatSelectionForModel(inputValue.value))) return
    if (!props.multi && typeof newVal !== 'object' && inputValue.value?.[0]?.[props.pick] === newVal && inputValue.value?.[0]?.[props.fields[0]]) return
    syncFromModelValue()
    await hydrateSingleSelectedData()
  },
  { deep: true }
)

const displayValue = computed(() => {
  if (!inputValue.value?.length) return props.placeholder
  if (props.preview && !hasChanged.value) return props.preview

  if (!props.multi) {
    return inputValue.value[0][props.fields[0]] || `${inputValue.value.length} Terpilih`
  }

  const itemNames = inputValue.value.map((item) => item[props.fields[0]]).filter((item) => item != null && item !== '')
  if (itemNames.length) {
    const visibleNames = itemNames.slice(0, 2).join(', ')
    if (itemNames.length > 2) return `${visibleNames}, ${itemNames.length - 2} lainnya`
    return visibleNames
  }

  return `${inputValue.value.length} Terpilih`
})

const selectedIds = computed(() => stagedInputValue.value.map((item: any) => item[props.pick]))
const previewTableKey = computed(() => inputValue.value.map((item: any) => String(item?.[props.pick] ?? '')).join('|'))

function handleClick(data: Record<string, any>) {
  hasChanged.value = true
  if (!props.multi) {
    // If the clicked item is already selected, deselect it
    if (stagedInputValue.value.length && stagedInputValue.value[0][props.pick] === data[props.pick]) {
      stagedInputValue.value = []
    } else {
      stagedInputValue.value = [data]
    }
    return
  }
  const currentDataIndex = stagedInputValue.value.findIndex((item) => item[props.pick] === data[props.pick])
  if (currentDataIndex == -1) stagedInputValue.value.push(data)
  else stagedInputValue.value.splice(currentDataIndex, 1)
}
</script>

<template>
  <BaseInput v-bind="props">
    <div class="flex flex-row items-center gap-2">
      <Dialog @close="resetStagedInputValue">
        <template #trigger>
          <slot v-if="$slots['trigger']" name="trigger"></slot>
          <div
            v-else
            :key="`${String(displayValue)}`"
            class="overlay flex max-w-fit cursor-pointer flex-row items-center justify-between gap-4 rounded-lg bg-surface-container-high px-4 py-2 after:bg-on-surface/[8%] after:active:bg-on-surface/[12%]"
          >
            <p v-if="displayValue" class="min-w-max">{{ displayValue }}</p>
            <Icon name="arrow-right-up" />
          </div>
        </template>
        <template #content="{ setOpen }">
          <div class="flex flex-col gap-4">
            <div class="flex flex-row items-center gap-2">
              <SearchBox v-model="params.search" class="w-full" />
              <Popover v-if="filterConfig?.fields?.length" :ignore="['#form-lookup']">
                <template #trigger>
                  <Button>
                    <Icon name="filter" />
                  </Button>
                </template>
                <template #content>
                  <Card class="w-[350px] outline outline-1 outline-outline" color="surface">
                    <Form
                      :key="keyManager().value['sys_lookupinput_filter']"
                      static
                      :modelValue="filterParameters"
                      @update:modelValue="(value) => (filterParameters = value as Record<string, any>)"
                      :fields="filterProps.fields"
                      :fieldsAlias="filterProps.fieldsAlias"
                      :inputConfig="(filterProps.inputConfig as any)"
                    />
                    <Button
                      @click="
                        () => {
                          filterParameters = {}
                          keyManager().triggerChange('sys_lookupinput_filter')
                        }
                      "
                    >
                      Reset Filter
                    </Button>
                  </Card>
                </template>
              </Popover>
            </div>
            <div v-if="props.multi" class="flex flex-row flex-wrap items-center gap-2">
              <Chip v-for="(item, index) in stagedInputValue" class="flex flex-row flex-wrap items-center gap-2">
                <div>{{ item[fields[0]] }}</div>
                <Icon size="xs" name="close" class="cursor-pointer" @click="() => stagedInputValue.splice(index, 1)"></Icon>
              </Chip>
            </div>
            <Table
              :fields="fields"
              :fieldsAlias="fieldsAlias"
              :fieldsType="fieldsType"
              :fieldsProxy="fieldsProxy"
              :fieldsDictionary="fieldsDictionary"
              :fieldsParse="fieldsParse"
              :limitSet="[5, 10]"
              :getAPI="getAPI"
              :getData="getData"
              :searchParameters="combinedSearchParameters"
              paginated
              :onRowClick="handleClick"
            >
              <template #list-rowActions="{ data }">
                <Checkbox v-if="multi" :onToggle="() => handleClick(data)" static :checked="selectedIds.includes(data[pick])" />
                <Radio v-else :checked="selectedIds[0] == data[pick]" />
              </template>
              <template #pagination-lengthControl>
                <div class="flex flex-row items-center gap-2">
                  <slot v-if="$slots['actionButton']" v-bind="{ searchParameters: combinedSearchParameters, selectedData: stagedInputValue, setOpen, isLoading }" name="actionButton" />
                  <Button
                    v-if="static"
                    :disabled="isLoading"
                    @click="
                      () => {
                        saveSelection()
                        setOpen(false)
                      }
                    "
                    ><Icon name="save"></Icon>Simpan</Button
                  >
                  <Button
                    v-else
                    :disabled="isLoading"
                    @click="
                      () => {
                        nonStaticCommit()
                        setOpen(false)
                      }
                    "
                    ><Icon name="save"></Icon>Simpan</Button
                  >
                </div>
              </template>
            </Table>
          </div>
        </template>
      </Dialog>
      <DialogForm v-if="inlineAddFormConfig" v-bind="(inlineAddFormConfig as any)">
        <template #trigger>
          <Button kind="icon" variant="standard"><Icon name="add"></Icon></Button>
        </template>
      </DialogForm>
    </div>
    <Table v-if="multi && modelValue?.length && !hidePreviewTable" :key="previewTableKey" :data="modelValue" :fields="fields" :fieldsAlias="fieldsAlias">
      <template #list-rowActions="{ data }">
        <ConfirmationDialog
          :onConfirm="
            async () => {
              handleClick(data)
              await saveSelection()
            }
          "
        >
          <template #trigger>
            <Button variant="tonal" color="error"><Icon name="delete-bin"></Icon></Button>
          </template>
        </ConfirmationDialog>
      </template>
    </Table>
  </BaseInput>
</template>
 
