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
import { loadAssignableRoles, setUserRole, users, type AssignableRole } from '@/framework/adapters/resources/users'


const route = useRoute('settings-users-detail-roles')
const userId = computed(() => route.params.userId)
const reloadToken = ref(0)

const table = computed(() => ({
  fields: { name: { label: 'Nama Role' } },
  namespace: 'user-roles',
  searchParameters: { user_id: userId.value, reload: reloadToken.value },
  load: () => loadAssignableRoles(userId.value),
}))

const pending = ref(new Set<string>())
const optimistic = ref<Record<string, boolean>>({})

function isPending(id: string) {
  return pending.value.has(id)
}

function activeOf(record: AssignableRole) {
  return optimistic.value[String(record.id)] ?? Boolean(record.active)
}

async function toggle(record: AssignableRole, next: boolean) {
  const roleId = String(record.id)
  if (pending.value.has(roleId)) return

  const previous = activeOf(record)
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
        :checked="activeOf(record as AssignableRole)"
        :disabled="isPending(String(record.id))"
        :aria-label="`Role ${value}`"
        @change="toggle(record as AssignableRole, ($event.target as HTMLInputElement).checked)"
      />
    </template>
  </ListView>
</template>
