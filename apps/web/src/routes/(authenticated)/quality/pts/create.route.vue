<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { createReportSchema } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.schemas'
import { inputUpload } from '@/framework/adapters/upload'
import { loadPtsLookups, ptsOperations, type PtsLookups } from './pts.operations'

const router = useRouter()
const pending = ref(false)
const uploading = ref(false)
const loading = ref(true)
const lookup = ref<PtsLookups>({ divisions: [], projects: [], workItems: [], ptsWorkCategories: [], rootCauses: [], projectVendors: [] })
const model = reactive({
  date: '',
  divisionId: '',
  projectId: '',
  ptsWorkCategoryId: '',
  workItemCategoryId: '',
  workItemId: '',
  criteriaCode: 'low' as 'low' | 'medium' | 'high',
  rootCauseIds: [] as string[],
  imgBefore: '',
  location: '',
  description: '',
})

const projectOptions = computed(() => lookup.value.projects.filter((project) => project.divisionId === model.divisionId))
const projectWorkItems = computed(() => lookup.value.workItems.filter((item) => item.projectId === model.projectId))
const workItemOptions = computed(() => projectWorkItems.value.filter((item) => projectWorkItems.value.some((child) => child.parentId === item.id)))
const leafWorkItemOptions = computed(() =>
  projectWorkItems.value.filter((item) => !projectWorkItems.value.some((child) => child.parentId === item.id) && belongsToCategory(item.id, model.workItemCategoryId))
)

function belongsToCategory(workItemId: string, categoryId: string) {
  const parents = new Map(lookup.value.workItems.map((item) => [item.id, item.parentId]))
  let parentId = parents.get(workItemId) ?? null
  while (parentId) {
    if (parentId === categoryId) return true
    parentId = parents.get(parentId) ?? null
  }
  return false
}

onMounted(async () => {
  try {
    lookup.value = await loadPtsLookups()
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'PTS lookups could not be loaded.')
  } finally {
    loading.value = false
  }
})

watch(
  () => model.divisionId,
  () => {
    model.projectId = ''
    model.workItemCategoryId = ''
    model.workItemId = ''
  }
)
watch(
  () => model.projectId,
  () => {
    model.workItemCategoryId = ''
    model.workItemId = ''
  }
)

async function submit() {
  if (pending.value) return
  pending.value = true
  try {
    const input = createReportSchema.parse({
      ...model,
      rootCauseIds: model.rootCauseIds,
    })
    const created = await ptsOperations.create!(input)
    await router.replace({ name: 'quality-pts-detail', params: { ptsId: String(created.id) } })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'PTS report could not be created.')
  } finally {
    pending.value = false
  }
}

async function uploadBefore(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    model.imgBefore = (await inputUpload(file, {})).path
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Before image could not be uploaded.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <form class="flex max-w-3xl flex-col gap-4" @submit.prevent="submit">
    <h1 class="text-xl font-semibold">Create PTS</h1>
    <label>Date <input v-model="model.date" type="date" required /></label>
    <label
      >Division
      <select v-model="model.divisionId" :disabled="loading" required>
        <option value="" disabled>Select division</option>
        <option v-for="division in lookup.divisions" :key="division.id" :value="division.id">{{ division.name }}</option>
      </select>
    </label>
    <label
      >Project
      <select v-model="model.projectId" :disabled="loading || !model.divisionId" required>
        <option value="" disabled>Select project</option>
        <option v-for="project in projectOptions" :key="project.id" :value="project.id">{{ project.number }} — {{ project.name }}</option>
      </select>
    </label>
    <label
      >PTS Work Category
      <select v-model="model.ptsWorkCategoryId" :disabled="loading" required>
        <option value="" disabled>Select category</option>
        <option v-for="category in lookup.ptsWorkCategories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
    </label>
    <label
      >Work Item Category
      <select v-model="model.workItemCategoryId" :disabled="loading || !model.projectId" required>
        <option value="" disabled>Select category</option>
        <option v-for="item in workItemOptions" :key="item.id" :value="item.id">{{ item.code }} — {{ item.name }}</option>
      </select>
    </label>
    <label
      >Leaf Work Item
      <select v-model="model.workItemId" :disabled="loading || !model.projectId" required>
        <option value="" disabled>Select work item</option>
        <option v-for="item in leafWorkItemOptions" :key="item.id" :value="item.id">{{ item.code }} — {{ item.name }}</option>
      </select>
    </label>
    <label
      >Criteria
      <select v-model="model.criteriaCode">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select></label
    >
    <label
      >Root Causes
      <select v-model="model.rootCauseIds" multiple required>
        <option v-for="cause in lookup.rootCauses" :key="cause.id" :value="cause.id">{{ cause.name }}</option>
      </select>
    </label>
    <label>Before Image <input type="file" accept="image/*" required @change="uploadBefore" /></label>
    <label>Location <input v-model="model.location" required /></label>
    <label>Description <textarea v-model="model.description" required /></label>
    <div>
      <button type="submit" :disabled="pending || uploading || !model.imgBefore">{{ pending ? 'Saving…' : 'Save' }}</button>
    </div>
  </form>
</template>
