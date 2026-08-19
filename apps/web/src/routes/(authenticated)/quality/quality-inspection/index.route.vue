<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ListView } from '@southneuhof/is-vue-framework'
import { Button, Icon } from '@southneuhof/is-vue-framework/components/base'
import ChipFilter from '@southneuhof/is-vue-framework/components/composites/ChipFilter.vue'
import { projects } from '@/routes/(authenticated)/master-data/projects/projects.resource'
import { qualityInspection } from './quality-inspection.resource'
import { statusOptions } from './quality-inspection.schema'
import QualityInspectionCardGrid from './QualityInspectionCardGrid.vue'

const router = useRouter()
type View = 'table' | 'grid'
type Status = 'open' | 'on-progress' | 'close'

const query = ref<Record<string, unknown>>({ statusCode: 'open' })
const list = qualityInspection.list() as ReturnType<typeof qualityInspection.list> & { table?: never }
const schedules = ref<unknown[]>([])
const hasCreateProject = ref(false)
const view = ref<View>('table')
const status = ref<Status>('open')
const createProjectSearchParameters = { permission: 'create-quality-inspection', active: true }
const statusItems = statusOptions.map(({ id, name }) => ({ id, label: name }))
const createRoute = computed(() => (hasCreateProject.value ? ({ name: 'quality-quality-inspection-create' } as const) : undefined))

function writeMonth(draft: Record<string, unknown>, value: unknown) {
  draft.startMonth = typeof value === 'string' ? value.slice(0, 7) : value
}

function writeEndMonth(draft: Record<string, unknown>, value: unknown) {
  draft.endMonth = typeof value === 'string' ? value.slice(0, 7) : value
}

const filters = {
  fields: {
    startMonth: { label: 'Periode Mulai', form: { renderer: 'month' }, write: writeMonth },
    endMonth: { label: 'Periode Selesai', form: { renderer: 'month' }, write: writeEndMonth },
  },
}

function can(record: Record<string, unknown>, operation: string) {
  return Array.isArray(record.allowedOperations) && record.allowedOperations.includes(operation)
}

function setStatus(value: unknown) {
  const nextStatus = value === 'on-progress' || value === 'close' ? value : 'open'
  status.value = nextStatus
  query.value = { ...query.value, statusCode: nextStatus, page: 1 }
}

function updateQuery(value: Record<string, unknown>) {
  query.value = value
}

function detailRoute(record: Record<string, unknown>) {
  return can(record, 'detail') ? ({ name: 'quality-quality-inspection-detail', params: { qualityInspectionId: String(record.id) } } as const) : undefined
}

function updateRoute(record: Record<string, unknown>) {
  return can(record, 'update') ? ({ name: 'quality-quality-inspection-edit', params: { qualityInspectionId: String(record.id) } } as const) : undefined
}

function canDelete(record: Record<string, unknown>) {
  return can(record, 'delete')
}

async function deleteRecord(record: Record<string, unknown>) {
  await qualityInspection.delete({ id: String(record.id) }).run()
}

onMounted(async () => {
  const permittedProjects = projects.list({ searchParameters: createProjectSearchParameters })
  try {
    const result = await permittedProjects.run({ query: {}, searchParameters: permittedProjects.searchParameters })
    hasCreateProject.value = result.data.length > 0
  } catch {
    hasCreateProject.value = false
  }
  try {
    schedules.value = (await qualityInspection.actions.loadSchedules.run()) as unknown[]
  } catch {
    schedules.value = []
  }
})

const scheduleCount = computed(() => schedules.value.length)
</script>

<template>
  <ListView
    v-bind="list"
    title="Inspection/Test"
    :query="query"
    :create-route="createRoute"
    :filters="filters"
    :presentation="view === 'grid' ? 'custom' : 'table'"
    :detail-route="detailRoute"
    :update-route="updateRoute"
    :can-delete="canDelete"
    :delete-record="deleteRecord"
    @update:query="updateQuery"
  >
    <template #header>
      <div class="flex min-w-0 flex-wrap items-center gap-3">
        <h1 class="text-lg font-semibold tracking-tight text-on-surface">Inspection/Test</h1>
        <span class="text-sm text-on-surface-variant">{{ scheduleCount }} asal jadwal</span>
        <div class="flex items-center gap-1 rounded-full bg-surface-container-low p-1">
          <Button type="button" :variant="view === 'table' ? 'tonal' : 'text'" :aria-pressed="view === 'table'" aria-label="Tampilan tabel" @click="view = 'table'">
            <template #icon><Icon name="table" /></template>
            Tabel
          </Button>
          <Button type="button" :variant="view === 'grid' ? 'tonal' : 'text'" :aria-pressed="view === 'grid'" aria-label="Tampilan kartu" @click="view = 'grid'">
            <template #icon><Icon name="layout-grid" /></template>
            Kartu
          </Button>
        </div>
      </div>
    </template>
    <template #filters>
      <ChipFilter v-model="status" :items="statusItems" @update:model-value="setStatus" />
    </template>
    <template #custom="collection">
      <QualityInspectionCardGrid :records="collection.records" :can-delete="canDelete" :delete-record="deleteRecord" />
      <p v-if="collection.loading" class="p-4 text-center" role="status">Memuat…</p>
      <p v-else-if="collection.error" class="p-4 text-center text-error" role="alert">{{ collection.error.message }}</p>
    </template>
    <template #controls>
      <Button v-if="hasCreateProject" type="button" variant="tonal" @click="router.push({ name: 'quality-quality-inspection-schedules' })">Jadwal Inspection/Test</Button>
    </template>
  </ListView>
</template>
