<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ListView, useResourceRuntime } from '@southneuhof/is-vue-framework'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import { permissions } from '@/stores/permissions'
import { setRolePermission, type RolePermission } from './role-permissions.operations'
import { rolePermissions } from './role-permissions.resource'

const route = useRoute('settings-roles-detail-permissions')
const roleId = computed(() => String(route.params.roleId))
const pending = ref(new Set<string>())
const canManage = permissions().has('manage-role-permissions')

function isPending(id: string) {
  return pending.value.has(id)
}

function permissionRow(record: Record<string, unknown>) {
  return record as unknown as RolePermission
}

async function toggle(row: RolePermission) {
  const permissionId = String(row.id)
  if (isPending(permissionId)) return
  const assigned = !row.assigned
  pending.value = new Set(pending.value).add(permissionId)
  try {
    await setRolePermission(roleId.value, permissionId, assigned)
    await rolePermissions.invalidate()
  } catch (error) {
    toast.error(useResourceRuntime().adapters.data.normalizeError(error).message || 'Permission update failed.')
  } finally {
    const remaining = new Set(pending.value)
    remaining.delete(permissionId)
    pending.value = remaining
  }
}
</script>

<template>
  <ListView title="Permissions" :resource="rolePermissions" :table-options="{ searchParameters: { role_id: roleId } }">
    <template #cell:assigned="{ record }">
      <Switch
        :model-value="permissionRow(record).assigned"
        role="switch"
        :aria-checked="permissionRow(record).assigned"
        :aria-label="'Permission ' + permissionRow(record).name"
        :data-permission="permissionRow(record).id"
        :disabled="!canManage || isPending(String(permissionRow(record).id))"
        @update:model-value="toggle(permissionRow(record))"
      />
    </template>
  </ListView>
</template>
