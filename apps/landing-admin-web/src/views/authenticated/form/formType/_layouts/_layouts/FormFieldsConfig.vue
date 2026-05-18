<script setup lang="ts">
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue';
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue';
import { keyManager } from '@/stores/keyManager';
import { toast } from 'vue-sonner';
import { parseCode } from '@/utils/common';
import services from '@/utils/services';
import { inject, ref } from 'vue';
import Draggable from 'vuedraggable'

  const formTypeData = inject<any>('data', {})

  const data = ref((await services.list('formField', {form_type_id: formTypeData.value.id, limit: 1000})).data)

  const formFieldForm: any = {
    fields: [
      'label',
      'label_en',
      'code',
      'type',
      'required',
      'data',
      'validation_type_code',
      'helper_message',
      'helper_message_en',
      'col_span'
    ],
    fieldsAlias: {
      type: 'Tipe',
      label: 'Label',
      label_en: 'Label (EN)',
      required: 'Wajib Diisi',
      data: 'Pilihan',
      helper_message: 'Pesan Bantuan',
      helper_message_en: 'Pesan Bantuan (EN)',
      col_span: 'Lebar Kolom',
      validation_type_code: 'Tipe Validasi'
    },
    inputConfig: {
      label: {
        type: 'text',
        span: 4,
        props: {
          helperMessage: 'Label untuk kolom formulir',
          required: true
        }
      },
      label_en: {
        type: 'text',
        span: 4,
        props: {
          helperMessage: 'Default ke ID apabila kosong'
        }
      },
      code: {
        type: 'text',
        span: 2,
        dependency: {
          field: ['label'],
          value: {
            generator: ({label}: any) => label ? parseCode(label) : '',
            default: ''
          }
        },
        props: {
          disabled: true
        }
      },
      type: {
        type: 'select',
        span: 2,
        props: {
          required: true,
          data: [
            {id: 'text', name: 'Text'},
            {id: 'textarea', name: 'Textarea'},
            {id: 'number', name: 'Angka'},
            {id: 'image', name: 'Image'},
            {id: 'file', name: 'File'},
            {id: 'date', name: 'Date'},
            {id: 'select', name: 'Pilihan'},
          ]
        }
      },
      data: {
        type: 'table',
        dependency: {
          field: ['type'],
          visibility: {
            validator: ({type}: any) => type === 'select',
            default: false
          },
        },
        props: {
          fields: [
            // 'label',
            'value'
          ],
          fieldsAlias: {
            // label: 'Nama Pilihan',
            value: 'Nilai Pilihan'
          },
          form: {
            inputConfig: {
              // label: {type: 'text', props: {required: true}},
              value: {type: 'text', props: {required: true}},
            }
          }
        }
      },
      validation_type_code: {
        type: 'select',
        props: {
          data: [
            {id: 'email', name: 'Email'},
            {id: 'phone', name: 'Nomor Telepon'},
            {id: 'number', name: 'Angka'},
            {id: 'url', name: 'URL/Link'},
            {id: 'date', name: 'Tanggal'},
            {id: 'file', name: 'File'},
          ]
        }
      },
      required: {
        type: 'checkbox',
      },
      helper_message: {
        type: 'text',
      },
      helper_message_en: {
        type: 'text',
      },
      validationRegex: {
        type: 'text',
        props: {
          required: true
        }
      },
      col_span: {
        type: 'number',
        props: {
          required: true,
          suffix: '/12'
        }
      }
    },
    getInitialData: {
      col_span: 12
    }
  }

  const isLoadingReordering = ref(false)

  function handleFormFieldReorder(event: any) {
    isLoadingReordering.value = true
    if (!event.moved) return
    if (event.moved.newIndex != event.moved.oldIndex) {
      services.put('formField/reorder', {old_order: event.moved.oldIndex+1, new_order: event.moved.newIndex+1, id: event.moved.element.id}).then(() => {
        isLoadingReordering.value = false
      }).catch(err => {
        toast.error('Gagal mengubah urutan!')
        isLoadingReordering.value = false
      })
    }
  }
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-4">
        <p class="text-sm font-bold uppercase">Kolom</p>
        <div class="max-h-[70vh] flex flex-col gap-2 overflow-auto">
          <p v-if="!data.length" class="text-sm text-muted italic">Tidak ada data</p>
          <Draggable
            v-else
            v-model="data"
            class="flex flex-col gap-2"
            item-key="id"
            @change="handleFormFieldReorder"
            :disabled="isLoadingReordering"
          >
            <template #item="{element: item, index}">
              <Card class="flex-row items-center gap-2">
                <Icon class="-ml-2 cursor-move">drag_indicator</Icon>
                <div class="flex flex-col w-full">
                  <p>{{ item.label }}<span v-if="item.required" class="text-sm font-bold text-error">*</span> <span class="text-muted">({{ item.type }} v. {{ item.validation_type_code || 'none' }})</span></p>
                </div>
                <div class="flex flex-row items-center gap-2">
                  <ConfirmationDialog
                    :onConfirm="() => {
                      services.delete('formField', {id: item.id}).then(() => {
                        toast.success('Berhasil menghapus data!')
                        keyManager().triggerChange('form-type-detail-under')
                      })
                    }"
                  >
                    <template #trigger>
                      <Button variant="standard" color="error"><Icon>delete_forever</Icon></Button>
                    </template>
                  </ConfirmationDialog>
                  <DialogForm
                    v-bind="formFieldForm"
                    formType="update"
                    :getDetailData="() => JSON.parse(JSON.stringify(item))"
                    :onSuccess="() => {
                      toast.success('Berhasil menambahkan data!')
                      keyManager().triggerChange('form-type-detail-under')
                    }"
                    targetAPI="formField"
                  >
                    <template #trigger>
                      <Button variant="standard" color="warning"><Icon>edit</Icon></Button>
                    </template>
                  </DialogForm>
                </div>
              </Card>
            </template>
          </Draggable>
        </div>
        <DialogForm
          v-bind="formFieldForm"
          :extraData="{form_type_id: formTypeData.id}"
          :onSuccess="() => {
            toast.success('Berhasil menambahkan data!')
            keyManager().triggerChange('form-type-detail-under')
          }"
          targetAPI="formField"
        >
          <template #trigger>
            <Button class="w-full" variant="standard"><Icon>add</Icon>Tambah</Button>
          </template>
        </DialogForm>
      </div>
      <div class="flex flex-col gap-4">
        <p class="text-sm font-bold uppercase">Preview</p>
        <div class="grid grid-cols-12 cols gap-2">
          <div v-for="formField in data"
            class="flex flex-col gap-1"
            :style="{
              gridColumn: `span ${formField.col_span} / span ${formField.col_span}`
            }"
          >
            <p>{{ formField.label }}<span v-if="formField.required" class="text-error">*</span></p>
            <div class="outline outline-outline/[24%] outline-1 rounded-md p-4"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>