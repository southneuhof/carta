<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import services from '@/utils/services'
import type { CRUDCompositeConfig, CRUDOperations, CRUDResource } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const user = inject<any>('data')
const route = useRoute()
const pendingRoleIds = ref(new Set<string>())

function resolveUserId() {
  const id = user?.value?.id ?? user?.id ?? route.query['users_id']
  return Number(id || 0)
}

function setRolePending(roleId: string, pending: boolean) {
  const nextPendingIds = new Set(pendingRoleIds.value)
  if (pending) nextPendingIds.add(roleId)
  else nextPendingIds.delete(roleId)
  pendingRoleIds.value = nextPendingIds
}

function isRolePending(roleId: unknown) {
  return pendingRoleIds.value.has(String(roleId))
}

async function toggleUserRole(row: { id: string; active: boolean }, nextValue: boolean) {
  const roleId = String(row.id)
  if (pendingRoleIds.value.has(roleId)) return

  setRolePending(roleId, true)
  try {
    await services.post('mapping-user-roles/toggle', { user_id: resolveUserId(), role_id: row.id, active: nextValue })
  } catch {
    row.active = !nextValue
    toast.error('Gagal memperbarui role pengguna. Silakan coba lagi.')
  } finally {
    setRolePending(roleId, false)
  }
}

const unavailable = async () => { throw new Error('User-role mapping is unavailable because the current RPC does not expose this resource.') }
const unavailableOperations: CRUDOperations = { list: unavailable, detail: unavailable, create: unavailable, update: unavailable, delete: unavailable }

const usersMappingRoleConfig = {
  name: 'mapping-role-users',
  title: 'Role',
  operations: unavailableOperations,
  fields: ['role_name', 'role_code', 'description'],
  fieldsAlias: { role_name: 'Nama Role', role_code: 'Kode Role', description: 'Deskripsi' },
  actions: { create: false, delete: false, update: false, detail: false },
  view: { list: { searchParameters: { user_id: resolveUserId() } } },
} satisfies CRUDCompositeConfig<CRUDResource>
</script>

<template>
  <CRUDComposite :config="usersMappingRoleConfig">
    <template #list-rowActions="{ data }">
      <Switch
        v-model="data.active"
        :onToggle="(nextValue: boolean) => toggleUserRole(data, nextValue)"
        :disabled="isRolePending(data.id)"
      />
    </template>
  </CRUDComposite>
</template>
