<script setup lang="ts">
import { inject } from 'vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import { toast } from 'vue-sonner'
import { keyManager } from '@/stores/keyManager'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import { defineCRUDCompositeConfig, type CRUDListResult, type CRUDOperations } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { rpc } from '@/framework/rpc'

const data = inject<any>('data', {})
const unavailable = async () => { throw new Error('This operation is not available for role permissions.') }
const rolePermissionOperations: CRUDOperations = {
  async list() {
    const response = await rpc.roles[':roleId'].permissions.$get({ param: { roleId: String(data.value?.id || data.id) } })
    if (!response.ok) throw await response.json()
    return response.json() as Promise<CRUDListResult>
  },
  detail: unavailable,
  create: unavailable,
  update: unavailable,
  delete: unavailable,
}
const rolePermissionsConfig = defineCRUDCompositeConfig({
  name: 'mapping-role-permission',
  title: 'Permissions',
  permission: 'mapping-role-permission',
  resource: rpc.roles[':roleId'].permissions,
  operations: rolePermissionOperations,
  actions: { create: false, update: false, delete: false, detail: false },
  fields: ['name'],
  fieldsAlias: { name: 'Permission' },
})
</script>

<template>
  <CRUDComposite
    :config="rolePermissionsConfig"
  >
    <template #list-rowActions="{ data: rowData }">
      <Switch
        v-model="rowData.active"
        :onToggle="
          (nextValue: boolean) => {
            const route = rpc.roles[':roleId'].permissions[':permissionId']
            const request = { param: { roleId: String(data.value?.id || data.id), permissionId: String(rowData.id) } }
            if (nextValue) route.$put(request)
            else route.$delete(request)
          }
        "
      />
    </template>
    <template #list-view-header-action>
      <DialogForm
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
      </DialogForm>
    </template>
  </CRUDComposite>
</template>
