<script setup lang="ts">
import { type PropType } from 'vue'
import type { FieldsInput, RowReorderPayload, TableProps } from '../../../contracts'
import { commonProps } from '../../inputs/commonprops'
import BaseInput from '../../inputs/BaseInput.vue'
import Form from '../../core/Form.vue'
import Table from '../../core/Table.vue'
import Dialog from '../../base/Dialog.vue'
import Button from '../../base/Button.vue'
import Icon from '../../base/Icon.vue'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import type {
  TableInputFormOptions,
  TableInputRow,
  TableInputTableOptions,
} from './tableInput.types'
import {
  appendTableInputRow,
  removeTableInputRow,
  reorderedTableInputRows,
  replaceTableInputRow,
} from './tableInput.model'

const props = defineProps({
  title: String,
  fields: {
    type: [Array, Object] as PropType<FieldsInput<TableInputRow, TableInputRow>>,
    required: true,
  },
  form: {
    type: Object as PropType<TableInputFormOptions<TableInputRow>>,
    default: () => ({}),
  },
  table: {
    type: Object as PropType<TableInputTableOptions<TableInputRow>>,
    default: () => ({}),
  },
  reorderable: {
    type: Boolean,
    default: false,
  },
  rowKey: {
    type: [String, Function] as PropType<TableProps<TableInputRow>['rowKey']>,
  },
  ...commonProps,
})

if (props.reorderable && !props.rowKey) {
  throw new Error('[is-vue-framework] TableInput reorderable mode requires rowKey.')
}

const modelValue = defineModel<TableInputRow[]>({ default: () => [] })
const emit = defineEmits<{ (event: 'validation:touch'): void }>()

function cloneRow(row: TableInputRow): TableInputRow {
  if (typeof structuredClone === 'function') return structuredClone(row)
  return JSON.parse(JSON.stringify(row)) as TableInputRow
}

function updateRows(rows: TableInputRow[]) {
  modelValue.value = [...rows]
  emit('validation:touch')
}

function createRow(row: TableInputRow) {
  updateRows(appendTableInputRow(modelValue.value, row))
  return row
}

function replaceRow(index: number, row: TableInputRow) {
  updateRows(replaceTableInputRow(modelValue.value, index, row))
  return row
}

function deleteRow(index: number) {
  updateRows(removeTableInputRow(modelValue.value, index))
}

function reorderRows(payload: RowReorderPayload<TableInputRow>) {
  updateRows(reorderedTableInputRows(payload))
}
</script>

<template>
  <BaseInput v-bind="props" :label="''">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row items-center justify-between gap-4">
        <p class="text-xl">{{ label || title }}</p>
        <Dialog v-if="!disabled">
          <template #trigger>
            <slot v-if="$slots['create-button']" name="create-button" />
            <Button v-else type="button"><Icon name="add" />Tambah</Button>
          </template>
          <template #content="{ setOpen }">
            <Form
              v-bind="form"
              :fields="fields"
              :initial-data="{}"
              :submit="async (payload) => {
                const result = createRow(payload)
                setOpen(false)
                return result
              }"
            >
              <template #actions="{ submit, submitting }">
                <div class="flex justify-end gap-2">
                  <Button type="button" variant="tonal" @click="setOpen(false)">Batal</Button>
                  <Button type="button" :disabled="submitting" @click="submit"><Icon name="save" />Simpan</Button>
                </div>
              </template>
            </Form>
          </template>
        </Dialog>
      </div>

      <Table
        v-if="!$slots.table"
        v-bind="table"
        :fields="fields"
        :data="modelValue"
        :reorderable="reorderable && !disabled"
        :row-key="rowKey"
        @row-reorder="reorderRows"
      >
        <template v-if="!disabled" #row-actions="{ record, index }">
          <div class="flex flex-row items-center gap-2">
            <Dialog>
              <template #trigger>
                <Button type="button" kind="icon" color="warning" variant="tonal" aria-label="Edit row">
                  <Icon name="edit" />
                </Button>
              </template>
              <template #content="{ setOpen }">
                <Form
                  v-bind="form"
                  :fields="fields"
                  :initial-data="cloneRow(record)"
                  :submit="async (payload) => {
                    const result = replaceRow(index, payload)
                    setOpen(false)
                    return result
                  }"
                >
                  <template #actions="{ submit, submitting }">
                    <div class="flex justify-end gap-2">
                      <Button type="button" variant="tonal" @click="setOpen(false)">Batal</Button>
                      <Button type="button" :disabled="submitting" @click="submit"><Icon name="save" />Simpan</Button>
                    </div>
                  </template>
                </Form>
              </template>
            </Dialog>
            <ConfirmationDialog :on-confirm="() => deleteRow(index)">
              <template #trigger>
                <Button type="button" kind="icon" color="error" variant="tonal" aria-label="Delete row">
                  <Icon name="delete-bin" />
                </Button>
              </template>
            </ConfirmationDialog>
          </div>
        </template>
      </Table>
      <slot v-else name="table" :data="modelValue" />
    </div>
  </BaseInput>
</template>
