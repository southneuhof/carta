<script setup lang="ts">
/**
 * One overtime request and its verification timeline.
 *
 * Workflow buttons exist or not depending on record state, so this route owns
 * their markup. Record loads here because `DetailProps` does not hand loaded
 * data back to parent; route passes it through `data`, so fetch remains one.
 *
 * None of this is authorization. The API decides; this only decides what to draw,
 * and a refusal still surfaces as a toast.
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, ListView } from '@southneuhof/is-vue-framework'
import { overtimes } from '../overtimes.resource'
import { type Overtime } from '../overtimes.operations'
import { verificationSteps } from './verification-steps.resource'
import { type VerificationStep } from './verification-steps.operations'
import { loadOvertime, submitOvertime, verifyOvertime } from './overtime-workflow.operations'
import { orgIdentity, type OrgIdentity } from '@/framework/identity'


const route = useRoute('hr-overtimes-detail')
const overtimeId = computed(() => route.params.overtimeId)

const record = ref<Overtime | undefined>()
const steps = ref<VerificationStep[]>([])
const identity = ref<OrgIdentity | null>(null)
const pending = ref(false)
const rejecting = ref(false)
const rejectionReason = ref('')

const stepsTable = computed(() => verificationSteps.table({ searchParameters: { overtime_id: overtimeId.value } }).table)

async function refresh() {
  if (!overtimeId.value) return
  record.value = await loadOvertime(overtimeId.value)
  const loaded = await verificationSteps
    .table()
    .table.load!({ query: {}, searchParameters: { overtime_id: overtimeId.value } })
  steps.value = (loaded as { data: VerificationStep[] }).data
}

watch(overtimeId, () => void refresh(), { immediate: true })
void orgIdentity().then((resolved) => (identity.value = resolved))

/** The step the chain is currently waiting on, if any. */
const currentStep = computed(() => steps.value.find((step) => step.statusCode === 'waiting'))

const isDraft = computed(() => record.value?.statusCode === 'draft')
const isWaiting = computed(() => record.value?.statusCode === 'waiting')

/**
 * Mirrors the server rule closely enough to decide what to render: the caller is
 * the step's named recipient, or holds the step's job position in the record's
 * section, or has cross-section scope.
 */
const mayVerify = computed(() => {
  const step = currentStep.value
  const who = identity.value
  if (!isWaiting.value || !step || !who) return false
  if (who.scope === 'all') return true
  if (step.recipientEmployeeId && who.employeeId === step.recipientEmployeeId) return true
  return Boolean(step.jobPositionId && who.jobPositionId === step.jobPositionId && who.sectionId === record.value?.sectionId)
})

const maySubmit = computed(() => isDraft.value && (identity.value?.employeeId === record.value?.applicantEmployeeId || identity.value?.scope === 'all'))

async function run(work: () => Promise<void>, success: string) {
  if (pending.value) return
  pending.value = true
  try {
    await work()
    await overtimes.invalidate({ id: overtimeId.value })
    await refresh()
    toast.success(success)
  } catch {
    toast.error('Action failed. Please try again.')
  } finally {
    pending.value = false
  }
}

function onSubmit() {
  void run(() => submitOvertime(overtimeId.value), 'Request sent for verification.')
}

function onApprove() {
  void run(() => verifyOvertime(overtimeId.value, 'approved'), 'Request approved.')
}

function onReject() {
  const description = rejectionReason.value.trim()
  if (!description) {
    toast.error('A rejection reason is required.')
    return
  }
  rejecting.value = false
  rejectionReason.value = ''
  void run(() => verifyOvertime(overtimeId.value, 'rejected', description), 'Request rejected.')
}

const view = computed(() => {
  const surface = overtimes.detail({ id: overtimeId.value })
  return { ...surface, detail: { ...surface.detail, data: record.value } }
})

const editTarget = computed(() => {
  const target = overtimes.capabilities.update?.to
  return target && { name: target.name, params: target.params(overtimeId.value) }
})

</script>

<template>
  <div>
    <DetailView title="Overtime Details" :back-to="{ name: overtimes.capabilities.list!.to!.name }" :detail="view.detail">
      <template #controls>
        <RouterLink v-if="editTarget" :to="editTarget"><Button>Edit</Button></RouterLink>
        <Button v-if="maySubmit" :disabled="pending" @click="onSubmit">Send for Verification</Button>
        <Button v-if="mayVerify" :disabled="pending" @click="onApprove">Approve</Button>
        <Button v-if="mayVerify" color="error" :disabled="pending" @click="rejecting = true">Reject</Button>
      </template>
    </DetailView>

    <section v-if="rejecting" data-reject-dialog>
      <label for="rejection-reason">Rejection reason</label>
      <textarea id="rejection-reason" v-model="rejectionReason" data-rejection-reason></textarea>
      <button type="button" data-confirm-reject @click="onReject">Reject request</button>
      <button type="button" data-cancel-reject @click="rejecting = false">Cancel</button>
    </section>

    <ListView title="Verification History" :table="stepsTable" />

  </div>
</template>
