<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, useResourceRuntime } from '@southneuhof/is-vue-framework'
import { inputUpload } from '@/framework/adapters/upload'
import { pts } from '../pts.resource'
import { ptsOperations, submitPtsAction, type Pts } from '../pts.operations'
import type { ActionInput, ActionName } from '@southneuhof/api/routes/qhsse-pts/qhsse-pts.schemas'

const route = useRoute('quality-pts-detail')
const ptsId = String(route.params.ptsId)
const pending = ref<ActionName | undefined>()
const selectedAction = ref<ActionName>()
const actionInput = reactive({
  notes: '',
  targetDate: '',
  cost: '',
  imgProcess: '',
  imgAfter: '',
  date: '',
  vendorId: '',
  dispositionStatusCode: 'low',
  decision: 'approve' as 'approve' | 'reject',
})
const record = ref<Pts | undefined>()
const available = ref<ActionName[]>([])
const uploading = ref(false)

async function reload() {
  record.value = await ptsOperations.detail!({ id: ptsId, searchParameters: {} })
  available.value = record.value?.availableActions ?? []
  selectedAction.value = available.value[0]
}

onMounted(async () => {
  try {
    await reload()
  } catch (error) {
    toast.error(useResourceRuntime().adapters.data.normalizeError(error).message || 'PTS could not be loaded.')
  }
})
function actionPayload(action: ActionName): ActionInput {
  if (action === 'disposition') return { dispositionStatusCode: actionInput.dispositionStatusCode, notes: actionInput.notes }
  if (action === 'temporary-plan') return { temporaryPlan: actionInput.notes, targetDate: actionInput.targetDate }
  if (action === 'management-notes') return { managementNotes: actionInput.notes, targetDate: actionInput.targetDate }
  if (action === 'complete-analysis') return { analysis: actionInput.notes, targetDate: actionInput.targetDate }
  if (action === 'follow-up-implementation') return { implementationPlan: actionInput.notes, targetDate: actionInput.targetDate }
  if (action === 'follow-up-price') return { priceFollowUp: actionInput.notes, targetDate: actionInput.targetDate, cost: actionInput.cost }
  if (action === 'implementation-report')
    return {
      implementationReport: actionInput.notes,
      implementationDate: actionInput.date,
      cost: actionInput.cost,
      imgProcess: actionInput.imgProcess,
      imgAfter: actionInput.imgAfter,
    }
  if (action === 'verification') return { decision: actionInput.decision, notes: actionInput.notes }
  if (action === 'realization') return { realization: actionInput.notes, date: actionInput.date, actualCost: actionInput.cost, vendorId: actionInput.vendorId }
  return { closeNotes: actionInput.notes, closeDate: actionInput.date }
}

async function run() {
  const action = selectedAction.value
  if (!action) return
  pending.value = action
  try {
    await submitPtsAction(ptsId, action, actionPayload(action))
    toast.success('PTS action completed.')
    await pts.invalidate()
    await reload()
  } catch (error) {
    toast.error(useResourceRuntime().adapters.data.normalizeError(error).message || 'PTS action failed.')
    await pts.invalidate()
    await reload()
  } finally {
    pending.value = undefined
  }
}

async function uploadImage(key: 'imgProcess' | 'imgAfter', event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    actionInput[key] = (await inputUpload(file, {})).path
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Image could not be uploaded.')
  } finally {
    uploading.value = false
  }
}

const actionLabel = computed(() => available.value.map((action) => action.replaceAll('-', ' ')))
</script>

<template>
  <DetailView title="PTS Detail" :back-to="{ name: 'quality-pts' }" :resource="pts" :id="ptsId">
    <template #controls>
      <RouterLink v-if="record?.stepCode === 'report' && record.statusCode !== 'closed'" :to="{ name: 'quality-pts-edit', params: { ptsId } }"><Button>Update</Button></RouterLink>
      <form v-if="available.length" class="flex max-w-xl flex-col gap-2" @submit.prevent="run">
        <label
          >Action
          <select v-model="selectedAction" :disabled="pending !== undefined" required>
            <option v-for="(action, index) in available" :key="action" :value="action">{{ actionLabel[index] }}</option>
          </select>
        </label>
        <label v-if="selectedAction === 'disposition'"
          >Disposition status
          <select v-model="actionInput.dispositionStatusCode">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select></label
        >
        <label v-if="selectedAction === 'verification'"
          >Decision
          <select v-model="actionInput.decision">
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select></label
        >
        <label v-if="selectedAction !== 'disposition' && selectedAction !== 'verification'">Notes <textarea v-model="actionInput.notes" required /></label>
        <label v-if="selectedAction === 'disposition' || selectedAction === 'verification'">Notes <textarea v-model="actionInput.notes" required /></label>
        <label v-if="['temporary-plan', 'management-notes', 'complete-analysis', 'follow-up-implementation', 'follow-up-price'].includes(selectedAction ?? '')"
          >Target date <input v-model="actionInput.targetDate" type="date" required
        /></label>
        <label v-if="['follow-up-price', 'implementation-report', 'realization'].includes(selectedAction ?? '')"
          >Cost <input v-model="actionInput.cost" type="number" min="0" step="0.01" required
        /></label>
        <label v-if="selectedAction === 'implementation-report'">Implementation date <input v-model="actionInput.date" type="date" required /></label>
        <label v-if="selectedAction === 'close'">Close date <input v-model="actionInput.date" type="date" required /></label>
        <label v-if="selectedAction === 'implementation-report'">Process image <input type="file" accept="image/*" required :disabled="uploading" @change="uploadImage('imgProcess', $event)" /></label>
        <label v-if="selectedAction === 'implementation-report'">After image <input type="file" accept="image/*" required :disabled="uploading" @change="uploadImage('imgAfter', $event)" /></label>
        <label v-if="selectedAction === 'realization'"
          >Project vendor
          <select v-model="actionInput.vendorId" required>
            <option value="" disabled>Select vendor</option>
            <option v-for="vendor in record?.projectVendors ?? []" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option>
          </select>
        </label>
        <button type="submit" :disabled="pending !== undefined || uploading">{{ pending ? 'Saving…' : 'Submit action' }}</button>
      </form>
    </template>
  </DetailView>
  <p v-if="record?.rootCauses?.length">Root causes: {{ record.rootCauses.map((cause) => cause.name).join(', ') }}</p>
  <section v-if="record?.activity?.length">
    <h2 class="mt-4 font-semibold">Activity</h2>
    <ul>
      <li v-for="entry in record.activity" :key="String(entry.id)">{{ entry.shortDescription }} — {{ entry.createdAt }}</li>
    </ul>
  </section>
</template>
