<script setup lang="ts">
import type { PropType } from 'vue'
import { commonProps } from '../../inputs/commonprops'
import BaseInput from '../../inputs/BaseInput.vue'
import DialogForm from '../DialogForm.vue'
import Table from '../Table.vue'
import { keyManager } from '@southneuhof/is-vue-framework/adapters/state'
import { useId } from 'radix-vue'
import ConfirmationDialog from '../ConfirmationDialog.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const props = defineProps({
  title: String,
  fields: { type: Array as PropType<string[]> },
  fieldsAlias: { type: Object },
  form: { type: Object as PropType<Record<string, unknown>>, required: true },
  table: { type: Object as PropType<Record<string, unknown>> },
  formData: { type: Object },
  draggable: { type: Boolean, default: false },
  ...commonProps,
})

const modelValue = defineModel<any[]>({ default: () => [] })

const id = useId()

const _console = console
</script>

<template>
  <BaseInput v-bind="props" :label="''">
    <div class="flex flex-col gap-4">
      <div class="flex flex-row items-center justify-between gap-4">
        <p class="text-xl">{{ label || title }}</p>
        <DialogForm
          v-if="!disabled"
          v-bind="{
            ...(form as any),
            fields: form?.fields || fields,
            fieldsAlias: { ...(fieldsAlias as Record<string, unknown>), ...((form?.fieldsAlias as Record<string, unknown>) || {}) },
          }"
          :onSubmit="
            async ({ payload }) => {
              modelValue.push(payload)
              modelValue = [...modelValue]
              keyManager().triggerChange(`table-input-${id}`)
            }
          "
        >
          <template #trigger>
            <Button v-if="!$slots['create-button']"><Icon name="add"></Icon>Tambah</Button>
            <slot v-else name="create-button" />
          </template>
        </DialogForm>
      </div>
      <Table
        v-if="!$slots['table']"
        v-bind="({
          ...table,
          fields: table?.fields || fields,
          fieldsAlias: { ...(fieldsAlias as Record<string, unknown>), ...((table?.fieldsAlias as Record<string, unknown>) || {}) },
        } as any)"
        :data="modelValue"
        :key="keyManager().value[`table-input-${id}`]"
        :draggable="draggable && !disabled"
        v-model="modelValue"
      >
        <template v-if="!disabled" #list-rowActions="{ data, index }">
          <div class="flex flex-row items-center gap-2">
            <DialogForm
              v-bind="{
                ...(form as any),
                fields: form?.fields || fields,
                fieldsAlias: { ...(fieldsAlias as Record<string, unknown>), ...((form?.fieldsAlias as Record<string, unknown>) || {}) },
              }"
              :onSubmit="
                async ({ payload }) => {
                  modelValue[index] = payload
                  keyManager().triggerChange(`table-input-${id}`)
                }
              "
              :getDetailData="() => JSON.parse(JSON.stringify(data))"
              formType="update"
            >
              <template #trigger>
                <Button color="warning" variant="tonal"><Icon name="edit"></Icon></Button>
              </template>
            </DialogForm>
            <ConfirmationDialog
              :onConfirm="
                () => {
                  modelValue.splice(index, 1)
                  keyManager().triggerChange(`table-input-${id}`)
                }
              "
            >
              <template #trigger>
                <Button color="error" variant="tonal"><Icon name="delete-bin"></Icon></Button>
              </template>
            </ConfirmationDialog>
          </div>
        </template>
      </Table>
      <slot v-else name="table" v-bind="{ data: modelValue }" />
    </div>
  </BaseInput>
</template>
