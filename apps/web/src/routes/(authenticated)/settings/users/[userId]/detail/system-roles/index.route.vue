<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ListView, useResourceRuntime } from '@southneuhof/is-vue-framework'
import { Alert, Button, Spinner } from '@southneuhof/is-vue-framework/components/base'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import { identity, refreshIdentity } from '@/framework/identity'
import { permissions } from '@/stores/permissions'
import { systemRoleAssignments } from './system-role-assignments.resource'
import type { SystemRoleAssignment } from './system-role-assignments.schema'

const route = useRoute('settings-users-detail-system-roles')
const userId = computed(() => String(route.params.userId))
const rows = ref<SystemRoleAssignment[]>([])
const pending = ref(new Set<string>())
const loading = ref(false)
const errorMessage = ref('')
const canManage = computed(() => permissions().has('manage-system-role-assignments'))
const listQuery = ref<Record<string, unknown>>({})
const rowsVersion = ref(0)
const list = computed(() => systemRoleAssignments.list({ namespace: `system-role-assignments-${userId.value}`, searchParameters: { userId: userId.value } }))

const visibleRows = computed(() => {
  const search = String(listQuery.value.search ?? '').trim().toLowerCase()
  if (!search) return rows.value
  return rows.value.filter((row) => [row.roleCode, row.name, row.description].some((value) => String(value ?? '').toLowerCase().includes(search)))
})

const listSurface = computed(() => {
  const data = [...visibleRows.value]
  return {
    ...list.value,
    searchParameters: { ...list.value.searchParameters, _version: rowsVersion.value },
    run: async () => ({ data, meta: { total: data.length } }),
    pagination: false as const,
  }
})

function messageFor(error: unknown) {
  return useResourceRuntime().adapters.data.normalizeError(error).message || 'System role update failed.'
}

async function reload() {
  loading.value = true
  errorMessage.value = ''
  rows.value = []
  try {
    rows.value = (await list.value.run({ query: {}, searchParameters: list.value.searchParameters })).data
    rowsVersion.value += 1
  } catch (error) {
    errorMessage.value = messageFor(error)
  } finally {
    loading.value = false
  }
}

function isPending(roleId: string) {
  return pending.value.has(roleId)
}

function roleRow(record: Record<string, unknown>) {
  return record as unknown as SystemRoleAssignment
}

async function toggle(row: SystemRoleAssignment) {
  const roleId = String(row.id)
  if (isPending(roleId) || (!row.active && !row.assigned)) return
  const assigned = !row.assigned
  pending.value = new Set(pending.value).add(roleId)
  try {
    const updated = await systemRoleAssignments.actions.set.run(userId.value, roleId, assigned)
    rows.value = rows.value.map((item) => item.id === row.id ? updated : item)
    rowsVersion.value += 1
    if (identity.value?.user.id === userId.value) await refreshIdentity()
  } catch (error) {
    toast.error(messageFor(error))
  } finally {
    const remaining = new Set(pending.value)
    remaining.delete(roleId)
    pending.value = remaining
  }
}

watch(userId, () => void reload(), { immediate: true })
</script>

<template>
  <div v-if="loading" class="flex justify-center p-8">
    <Spinner aria-hidden="true" />
    <span class="sr-only" role="status">Loading system roles...</span>
  </div>
  <Alert v-else-if="errorMessage" type="error" role="alert">
    <p>{{ errorMessage }}</p>
    <Button type="button" @click="reload">Retry</Button>
  </Alert>
  <ListView v-else title="System Roles" v-bind="listSurface" :query="listQuery" @update:query="listQuery = $event">
    <template #cell:assigned="{ record }">
      <Switch
        :model-value="roleRow(record).assigned"
        role="switch"
        :aria-checked="roleRow(record).assigned"
        :aria-label="`System role ${roleRow(record).name}`"
        :data-role="roleRow(record).id"
        :disabled="!canManage || isPending(String(roleRow(record).id)) || (!roleRow(record).active && !roleRow(record).assigned)"
        @update:model-value="toggle(roleRow(record))"
      />
    </template>
  </ListView>
</template>
