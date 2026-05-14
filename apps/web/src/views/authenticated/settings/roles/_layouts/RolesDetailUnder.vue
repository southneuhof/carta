<script setup lang="ts">
import { inject } from 'vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import tasks from '@client/data-model/models/tasks.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import services from '@/utils/services'
import ModalForm from '@southneuhof/is-vue-framework/components/composites/ModalForm.vue'
import { toast } from 'vue-sonner'
import { keyManager } from '@/stores/keyManager'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'

const data = inject<any>('data', {})
</script>

<template>
  <CRUDComposite
    :config="{
      name: 'mapping-role-permission',
      title: 'Permissions',
      permission: 'mapping-role-permission',
      modelAPI: 'custom/mappingrolepermission',
      actions: {
        create: false,
        update: false,
        delete: false,
        detail: false,
      },
      fields: ['task_name', 'task_code', 'description'],
      fieldsAlias: tasks.fieldsAlias,
      view: {
        list: {
          searchParameters: {
            role_id: data.id,
          },
        },
      },
    }"
  >
    <template #list-rowActions="{ data: rowData }">
      <Switch
        v-model="rowData.active"
        :onToggle="
          (nextValue: boolean) => {
            services.update('custom/mappingrolepermission', { task_id: rowData.id, role_id: data.id, active: nextValue })
          }
        "
      />
    </template>
    <template #list-view-header-action>
      <ModalForm
        :fields="['source_role_id']"
        targetAPI="custom/mappingrolepermission/copy?custom"
        :fieldsAlias="{
          source_role_id: 'Role',
        }"
        :inputConfig="{
          source_role_id: {
            type: 'lookup',
            props: {
              fields: ['role_name', 'role_code', 'description'],
              fieldsAlias: {
                role_name: 'Nama Role',
                role_code: 'Kode Role',
                description: 'Deskripsi',
              },
              required: true,
              getAPI: 'roles',
            },
          },
        }"
        :extraData="{ target_role_id: data.id }"
        method="put"
        :onSuccess="
          () => {
            toast.success('Berhasil menyalin permission dari role!')
            keyManager().triggerChange(`roles-detail-under`)
          }
        "
      >
        <template #title>
          <p>Pilih Role Sumber</p>
        </template>
        <template #trigger>
          <Button kind="icon" variant="standard">Salin dari Role Lain<Icon name="file-copy"></Icon></Button>
        </template>
      </ModalForm>
    </template>
  </CRUDComposite>
</template>
