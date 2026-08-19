<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Form, ListView, useNamespacedQuery, useResourceRuntime } from '@southneuhof/is-vue-framework'
import { Alert, Button, Spinner } from '@southneuhof/is-vue-framework/components/base'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import { permissions } from '@/stores/permissions'
import { projectRoleAssignments } from './project-role-assignments.resource'
import type { ProjectRoleAssignment, ProjectRoleAssignmentOptions, ProjectRoleCoverage } from './project-role-assignments.schema'

const route = useRoute('settings-users-detail-project-roles')
const userId = computed(() => String(route.params.userId))
const query = useNamespacedQuery({ namespace: 'project-roles', defaults: { divisionId: '', projectId: '' } })
const options = ref<ProjectRoleAssignmentOptions>({ divisions: [], projects: [] })
const optionsReady = ref(false)
const rows = ref<ProjectRoleAssignment[]>([])
const rowsVersion = ref(0)
const pending = ref(new Set<string>())
const loading = ref(false)
const errorMessage = ref('')
const optionsError = ref('')
const canManage = computed(() => permissions().has('create-project-role-assignments') && permissions().has('delete-project-role-assignments'))
const listQuery = ref<Record<string, unknown>>({})
type ProjectRoleFilters = { divisionId: string; projectId: string }
type FilterOption = { id: string; name: string }

const visibleRows = computed(() => {
  const search = String(listQuery.value.search ?? '')
    .trim()
    .toLowerCase()
  if (!search) return rows.value
  // ponytail: role catalogs are small; keep ListView search local until the API accepts it.
  return rows.value.filter((row) =>
    [row.roleCode, row.name, row.description].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(search)
    )
  )
})

function queryValue(key: 'divisionId' | 'projectId') {
  const value = query.values.value[key]
  return typeof value === 'string' ? value : ''
}

const selectedDivisionId = computed(() => {
  const value = queryValue('divisionId')
  return options.value.divisions.some((division) => division.id === value) ? value : ''
})

const projectOptions = computed(() => (selectedDivisionId.value ? options.value.projects.filter((project) => project.divisionId === selectedDivisionId.value) : options.value.projects))

const selectedProjectId = computed(() => {
  const value = queryValue('projectId')
  return projectOptions.value.some((project) => project.id === value) ? value : ''
})

const coverage = computed<ProjectRoleCoverage>(() => {
  if (selectedProjectId.value) return { coverageType: 'project', projectId: selectedProjectId.value }
  if (selectedDivisionId.value) return { coverageType: 'division', divisionId: selectedDivisionId.value }
  return { coverageType: 'all_projects' }
})

const list = computed(() =>
  projectRoleAssignments.list({
    namespace: `project-role-assignments-${userId.value}`,
    searchParameters: { userId: userId.value, ...coverage.value },
  })
)

const listSurface = computed(() => {
  const data = [...visibleRows.value]
  return {
    ...list.value,
    searchParameters: { ...list.value.searchParameters, _version: rowsVersion.value },
    run: async () => ({ data, meta: { total: data.length } }),
    pagination: false as const,
  }
})

function setFilters(value: Record<string, unknown>) {
  const requestedDivision = typeof value.divisionId === 'string' ? value.divisionId : ''
  const nextDivision = options.value.divisions.some((division) => division.id === requestedDivision) ? requestedDivision : ''
  const nextProjects = nextDivision ? options.value.projects.filter((project) => project.divisionId === nextDivision) : options.value.projects
  const requestedProject = typeof value.projectId === 'string' ? value.projectId : ''
  const nextProject = nextProjects.some((project) => project.id === requestedProject) ? requestedProject : undefined
  query.update({ divisionId: nextDivision, projectId: nextProject })
}

const filterModel = computed<ProjectRoleFilters>({
  get: () => ({ divisionId: selectedDivisionId.value, projectId: selectedProjectId.value }),
  set: setFilters,
})

const divisionFilterOptions = computed<FilterOption[]>(() => [
  { id: '', name: 'All Divisions' },
  ...options.value.divisions.map((division) => ({ id: division.id, name: `${division.name}${division.active ? '' : ' (Inactive)'}` })),
])

const projectFilterOptions = computed<FilterOption[]>(() => [
  { id: '', name: 'All Projects' },
  ...projectOptions.value.map((project) => ({ id: project.id, name: `${project.number} — ${project.name}${project.active ? '' : ' (Inactive)'}` })),
])

const filterFields = computed(() => ({
  divisionId: {
    label: 'Division',
    form: {
      renderer: 'select',
      source: divisionFilterOptions.value,
      span: 6,
      props: { pick: 'id', view: 'name', searchable: false, clearable: false, placeholder: 'All Divisions' },
    },
  },
  projectId: {
    label: 'Project',
    form: {
      renderer: 'select',
      source: projectFilterOptions.value,
      span: 6,
      props: { pick: 'id', view: 'name', searchable: false, clearable: false, placeholder: 'All Projects' },
    },
  },
}))
const filterKey = computed(() => `${options.value.divisions.length}:${options.value.projects.length}:${selectedDivisionId.value}`)

const coverageKey = computed(() => {
  const selected = coverage.value
  if (selected.coverageType === 'division') return `${selected.coverageType}:${selected.divisionId}`
  if (selected.coverageType === 'project') return `${selected.coverageType}:${selected.projectId}`
  return selected.coverageType
})

function messageFor(error: unknown) {
  return useResourceRuntime().adapters.data.normalizeError(error).message || 'Project role update failed.'
}

function errorCode(error: unknown) {
  if (!error || typeof error !== 'object' || Array.isArray(error)) return undefined
  const code = (error as { error?: unknown }).error
  return typeof code === 'string' ? code : undefined
}

async function reloadOptions() {
  optionsReady.value = false
  optionsError.value = ''
  rows.value = []
  try {
    options.value = await projectRoleAssignments.actions.options.run(userId.value)
    optionsReady.value = true
  } catch (error) {
    optionsError.value = messageFor(error)
  }
}

async function reloadRows() {
  if (!optionsReady.value) return
  loading.value = true
  errorMessage.value = ''
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

function isLocked(row: ProjectRoleAssignment) {
  return row.locked && row.effective && !row.direct
}

function sourceId(row: ProjectRoleAssignment) {
  return `project-role-source-${row.id}`
}

function sourceTooltip(row: ProjectRoleAssignment) {
  return isLocked(row) && row.source ? { content: row.source.label, allowHTML: false } : undefined
}

function roleRow(record: Record<string, unknown>) {
  return record as unknown as ProjectRoleAssignment
}

async function toggle(row: ProjectRoleAssignment) {
  const roleId = String(row.id)
  if (!canManage.value || isLocked(row) || isPending(roleId) || (!row.active && !row.direct)) return
  const assigned = !row.direct
  pending.value = new Set(pending.value).add(roleId)
  try {
    await projectRoleAssignments.actions.set.run(userId.value, roleId, coverage.value, assigned)
    await reloadRows()
  } catch (error) {
    if (errorCode(error) === 'assignment_already_covered') await reloadRows()
    toast.error(messageFor(error))
  } finally {
    const remaining = new Set(pending.value)
    remaining.delete(roleId)
    pending.value = remaining
  }
}

watch(userId, () => void reloadOptions(), { immediate: true })
watch([optionsReady, coverageKey], () => void reloadRows(), { immediate: true })
</script>

<template>
  <Alert v-if="optionsError" type="error" role="alert">
    <p>{{ optionsError }}</p>
    <Button type="button" @click="reloadOptions">Retry</Button>
  </Alert>
  <Alert v-else-if="errorMessage" type="error" role="alert">
    <p>{{ errorMessage }}</p>
    <Button type="button" @click="reloadRows">Retry</Button>
  </Alert>
  <div v-else-if="!optionsReady || loading" class="flex justify-center p-8">
    <Spinner aria-hidden="true" />
    <span class="sr-only" role="status">Loading project roles...</span>
  </div>
  <ListView v-else title="Project Roles" v-bind="listSurface" :query="listQuery" @update:query="listQuery = $event">
    <template #filters>
      <Form :key="filterKey" v-model="filterModel" :fields="filterFields" />
    </template>
    <template #cell:effective="{ record }">
      <span v-if="isLocked(roleRow(record))" :id="sourceId(roleRow(record))" class="sr-only">{{ roleRow(record).source?.label }}</span>
      <Switch
        v-tippy="sourceTooltip(roleRow(record))"
        :model-value="roleRow(record).effective"
        role="switch"
        :data-role="roleRow(record).id"
        :aria-checked="roleRow(record).effective"
        :aria-disabled="isLocked(roleRow(record)) ? 'true' : undefined"
        :aria-describedby="isLocked(roleRow(record)) ? sourceId(roleRow(record)) : undefined"
        :title="isLocked(roleRow(record)) ? roleRow(record).source?.label : undefined"
        :disabled="isPending(String(roleRow(record).id)) || (!isLocked(roleRow(record)) && !canManage)"
        :aria-label="`Project role ${roleRow(record).name}`"
        @update:model-value="toggle(roleRow(record))"
      />
    </template>
  </ListView>
</template>
