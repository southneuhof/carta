<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { Button, Icon } from '@southneuhof/is-vue-framework/components/base'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { qualityInspection } from './quality-inspection.resource'
import { stepLabels } from './quality-inspection.schema'

const router = useRouter()
const query = ref<Record<string, unknown>>({})
const schedules = ref<unknown[]>([])
const hasCreateProject = ref(false)
const createProjectSearchParameters = { permission: 'create-quality-inspection', active: true }

function can(record: Record<string, unknown>, operation: string) {
  return Array.isArray(record.allowedOperations) && record.allowedOperations.includes(operation)
}

function step(record: Record<string, unknown>) {
  return stepLabels[String(record.stepCode)] ?? String(record.stepCode ?? '—')
}

onMounted(async () => {
  const permittedProjects = projects.list({ searchParameters: createProjectSearchParameters })
  try {
    const result = await permittedProjects.run({ query: {}, searchParameters: permittedProjects.searchParameters })
    hasCreateProject.value = result.data.length > 0
  } catch {
    hasCreateProject.value = false
  }
  try { schedules.value = await qualityInspection.actions.loadSchedules.run() as unknown[] } catch { schedules.value = [] }
})

const scheduleCount = computed(() => schedules.value.length)
</script>

<template>
  <ListView v-bind="qualityInspection.list()" title="Inspection/Test" :query="query" @update:query="query = $event">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <h1 class="text-lg font-semibold tracking-tight text-on-surface">Inspection/Test</h1>
        <span class="text-sm text-on-surface-variant">{{ scheduleCount }} scheduled origins</span>
      </div>
    </template>
    <template #controls>
      <Button v-if="hasCreateProject" type="button" variant="tonal" @click="router.push({ name: 'quality-quality-inspection-create' })">Buat Inspection/Test</Button>
      <Button v-if="hasCreateProject" type="button" variant="tonal" @click="router.push({ name: 'quality-quality-inspection-schedules' })">Jadwal Inspection/Test</Button>
    </template>
    <template #row-actions="{ record }">
      <div class="flex items-center justify-end gap-1">
        <Button v-if="can(record, 'update')" type="button" kind="icon" variant="standard" aria-label="Edit" @click.stop="router.push({ name: 'quality-quality-inspection-edit', params: { qualityInspectionId: String(record.id) } })">
          <template #icon><Icon name="edit" /></template>
        </Button>
        <Button v-if="can(record, 'detail')" type="button" kind="icon" variant="standard" aria-label="View" @click.stop="router.push({ name: 'quality-quality-inspection-detail', params: { qualityInspectionId: String(record.id) } })">
          <template #icon><Icon name="eye" /></template>
        </Button>
        <span class="sr-only">{{ step(record) }}</span>
      </div>
    </template>
  </ListView>
</template>
