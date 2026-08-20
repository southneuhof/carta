<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Table } from '@southneuhof/is-vue-framework'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import { Card } from '@southneuhof/is-vue-framework/components/base'
import { useRoute } from 'vue-router'
import { permissions } from '@/stores/permissions'
import { syllabusCategoryActions } from '../../../syllabus-categories.actions'

type RoleMapping = { id: string; roleId: string; active: boolean; role?: { id: string; name: string } | null }
const route = useRoute('orientation-syllabus-categories-detail-roles')
const categoryId = String(route.params.syllabusCategoryId)
const access = permissions()
const rows = ref<RoleMapping[]>([])
const loading = ref(false)
const pending = ref(new Set<string>())
const canManage = computed(() => access.has('update-syllabus-categories'))
const fields = { name: { label: 'Role', read: (row: RoleMapping) => row.role?.name ?? '—' }, active: { label: 'Status' } }

async function load() {
  loading.value = true
  try {
    rows.value = (await syllabusCategoryActions.roles({ categoryId })).data
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Daftar Role could not be loaded.')
  } finally {
    loading.value = false
  }
}

async function toggle(row: RoleMapping, value: boolean) {
  pending.value = new Set([...pending.value, row.roleId])
  try {
    await syllabusCategoryActions.toggleRole(categoryId, row.roleId, value)
    row.active = value
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Role could not be updated.')
  } finally {
    const next = new Set(pending.value)
    next.delete(row.roleId)
    pending.value = next
  }
}

onMounted(() => void load())
</script>

<template>
  <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
    <div class="border-b border-outline-variant px-4 py-3"><h2 class="font-semibold">Daftar Role</h2></div>
    <div v-if="loading" class="p-6 text-on-surface-variant" role="status">Loading...</div>
    <Table v-else :data="rows" :fields="fields" :pagination="false" row-key="id">
      <template #cell:active="{ record }"
        ><Switch :model-value="record.active" :disabled="!canManage || pending.has(record.roleId)" :aria-label="`Status ${record.role?.name ?? 'role'}`" @update:model-value="toggle(record, $event)"
      /></template>
    </Table>
  </Card>
</template>
