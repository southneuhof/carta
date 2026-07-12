<script setup lang="ts">
import { inject, ref } from 'vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import DialogForm from '@southneuhof/is-vue-framework/components/composites/DialogForm.vue'
import { toast } from 'vue-sonner'
import { keyManager } from '@/stores/keyManager'
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue'
import Icon from '@southneuhof/is-vue-framework/components/base/Icon.vue'
import type { CRUDCompositeConfig, CRUDListResult, CRUDOperations, CRUDResource } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { rpc } from '@/framework/rpc'

const data = inject<any>('data', {})
const pendingPermissionIds = ref(new Set<string>())

function setPermissionPending(permissionId: string, pending: boolean) {
  const nextPendingIds = new Set(pendingPermissionIds.value)
  if (pending) nextPendingIds.add(permissionId)
  else nextPendingIds.delete(permissionId)
  pendingPermissionIds.value = nextPendingIds
}

function isPermissionPending(permissionId: unknown) {
  return pendingPermissionIds.value.has(String(permissionId))
}

async function toggleRolePermission(row: { id: string; active: boolean }, nextValue: boolean) {
  const permissionId = String(row.id)
  if (pendingPermissionIds.value.has(permissionId)) return

  setPermissionPending(permissionId, true)
  try {
    const route = rpc.roles[':roleId'].permissions[':permissionId']
    const request = { param: { roleId: String(data.value?.id || data.id), permissionId } }
    const response = nextValue ? await route.$put(request) : await route.$delete(request)
    if (!response.ok) throw new Error('Permission toggle request failed')
  } catch {
    row.active = !nextValue
    toast.error('Gagal memperbarui permission. Silakan coba lagi.')
  } finally {
    setPermissionPending(permissionId, false)
  }
}

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
const rolePermissionsConfig = {
  name: 'mapping-role-permission',
  title: 'Permissions',
  permission: 'mapping-role-permission',
  operations: rolePermissionOperations,
  actions: { create: false, update: false, delete: false, detail: false },
  fields: ['name'],
  fieldsAlias: { name: 'Permission' },
} satisfies CRUDCompositeConfig<CRUDResource>

async function copyRolePermissions(payload: Record<string, any>) {
  const baseURL = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const response = await fetch(`${baseURL}/custom/mappingrolepermission/copy`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, target_role_id: data.value?.id || data.id }),
  })
  if (!response.ok) throw await response.json().catch(() => new Error(response.statusText))
  return response.json().catch(() => undefined)
}
</script>

<template>
  <CRUDComposite :config="rolePermissionsConfig">
    <template #list-rowActions="{ data: rowData }">
      <Switch
        v-model="rowData.active"
        :onToggle="(nextValue: boolean) => toggleRolePermission(rowData, nextValue)"
        :disabled="isPermissionPending(rowData.id)"
      />
    </template>
    <template #list-view-header-action>
      <DialogForm
        :fields="['source_role_id']"
        :fieldsAlias="{ source_role_id: 'Role' }"
        :inputConfig="{
          source_role_id: {
            type: 'lookup',
            props: {
              fields: ['role_name', 'role_code', 'description'],
              fieldsAlias: { role_name: 'Nama Role', role_code: 'Kode Role', description: 'Deskripsi' },
              required: true,
              getAPI: 'roles',
            },
          },
        }"
        :extraData="{ target_role_id: data.id }"
        :submit="copyRolePermissions"
        @success="() => {
          toast.success('Berhasil menyalin permission dari role!')
          keyManager().triggerChange('roles-detail-under')
        }"
      >
        <template #title><p>Pilih Role Sumber</p></template>
        <template #trigger>
          <Button kind="icon" variant="standard">Salin dari Role Lain<Icon name="file-copy" /></Button>
        </template>
      </DialogForm>
    </template>
  </CRUDComposite>
</template>
