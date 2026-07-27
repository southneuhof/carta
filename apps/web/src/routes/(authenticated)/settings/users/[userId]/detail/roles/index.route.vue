<script setup lang="ts">
/**
 * Role mapping for one user.
 *
 * The collection is an ordinary `load` keyed by `userId`; assigning a role is
 * explicit workflow code with optimistic reconciliation, rollback, per-row
 * concurrency protection, and targeted invalidation. No CRUD operation is
 * fabricated for mapping rows.
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ListView } from '@southneuhof/is-vue-framework'
import { users } from '../../../users.resource'
import { userRoles } from './user-roles.resource'
import { setUserRole, type UserRole } from './user-roles.operations'


const route = useRoute('settings-users-detail-roles')
const userId = computed(() => route.params.userId)
const reloadToken = ref(0)
const table = computed(() => userRoles.table({ namespace: 'user-roles', searchParameters: { user_id: userId.value, reload: reloadToken.value } }).table)

const pending = ref(new Set<string>())
const optimistic = ref<Record<string, boolean>>({})

function isPending(id: string) {
  return pending.value.has(id)
}

function assignedOf(record: UserRole) {
  return optimistic.value[String(record.id)] ?? record.assigned
}

async function toggle(record: UserRole, next: boolean) {
  const roleId = String(record.id)
  if (pending.value.has(roleId)) return

  const previous = assignedOf(record)
  optimistic.value = { ...optimistic.value, [roleId]: next }
  pending.value = new Set(pending.value).add(roleId)

  try {
    await setUserRole(userId.value, roleId, next)
    await users.invalidate({ id: userId.value })
    reloadToken.value += 1
    optimistic.value = {}
  } catch {
    optimistic.value = { ...optimistic.value, [roleId]: previous }
    toast.error('Gagal memperbarui role pengguna. Silakan coba lagi.')
  } finally {
    const remaining = new Set(pending.value)
    remaining.delete(roleId)
    pending.value = remaining
  }
}
</script>

<template>
  <ListView title="Role" :table="table">
    <template #cell:name="{ value, record }">
      <span>{{ value }}</span>
      <input
        type="checkbox"
        :data-role="record.id"
        :checked="assignedOf(record as UserRole)"
        :disabled="isPending(String(record.id))"
        :aria-label="`Role ${value}`"
        @change="toggle(record as UserRole, ($event.target as HTMLInputElement).checked)"
      />
    </template>
  </ListView>
</template>
