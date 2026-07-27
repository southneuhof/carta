<script setup lang="ts">
/**
 * Permissions of one role.
 *
 * Placement comes from the filesystem, and the parent identity is an ordinary
 * `searchParameters` entry. Toggling a permission is extraordinary behavior, so
 * it stays explicit code with optimistic update, rollback, per-row concurrency
 * protection, and semantic cache invalidation.
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ListView } from '@southneuhof/is-vue-framework'
import { rolePermissions } from './role-permissions.resource'
import { setRolePermission, type RolePermission } from './role-permissions.operations'
import CopyPermissionsDialog from './CopyPermissionsDialog.vue'


const route = useRoute('settings-roles-detail-permissions')
const roleId = computed(() => route.params.roleId)

const table = computed(() => rolePermissions.table({ searchParameters: { role_id: roleId.value } }).table)
const pending = ref(new Set<string>())
const optimistic = ref<Record<string, boolean>>({})

function isPending(id: string) {
  return pending.value.has(id)
}

function assignedOf(record: RolePermission) {
  return optimistic.value[String(record.id)] ?? Boolean(record.assigned)
}

async function toggle(record: RolePermission, next: boolean) {
  const permissionId = String(record.id)
  if (pending.value.has(permissionId)) return

  const previous = assignedOf(record)
  optimistic.value = { ...optimistic.value, [permissionId]: next }
  pending.value = new Set(pending.value).add(permissionId)

  try {
    await setRolePermission(roleId.value, permissionId, next)
    await rolePermissions.invalidate()
  } catch {
    optimistic.value = { ...optimistic.value, [permissionId]: previous }
    toast.error('Gagal memperbarui permission. Silakan coba lagi.')
  } finally {
    const remaining = new Set(pending.value)
    remaining.delete(permissionId)
    pending.value = remaining
  }
}

async function onCopied() {
  optimistic.value = {}
  await rolePermissions.invalidate()
}
</script>

<template>
  <ListView title="Permissions" :table="table">
    <template #filters>
      <CopyPermissionsDialog :target-role-id="roleId" @copied="onCopied" />
    </template>

    <template #cell:name="{ value, record }">
      <span>{{ value }}</span>
      <input
        type="checkbox"
        :data-permission="record.id"
        :checked="assignedOf(record as RolePermission)"
        :disabled="isPending(String(record.id))"
        :aria-label="`Permission ${value}`"
        @change="toggle(record as RolePermission, ($event.target as HTMLInputElement).checked)"
      />
    </template>
  </ListView>
</template>
