<script setup lang="ts">
/**
 * One overtime request and its verification timeline.
 *
 * Two things here are not ordinary CRUD. The workflow controls exist or not
 * depending on the record's state rather than on the resource's capabilities, so
 * they are custom `ViewControl` descriptors computed from the loaded record — an
 * unavailable control is **absent, not disabled**. And the record is loaded by this
 * route rather than by `DetailView`, because `DetailProps` does not hand its loaded
 * record back to the parent and the controls need it; the record is passed back
 * through `data`, so there is still one fetch.
 *
 * None of this is authorization. The API decides; this only decides what to draw,
 * and a refusal still surfaces as a toast.
 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, ListView, type ActionableControl } from '@southneuhof/is-vue-framework'
import {
  loadOvertime,
  overtimes,
  submitOvertime,
  verificationSteps,
  verifyOvertime,
  type Overtime,
  type VerificationStep,
} from '@/framework/adapters/resources/overtimes'
import { orgIdentity, type OrgIdentity } from '@/framework/identity'


const route = useRoute('hr-overtimes-detail')
const router = useRouter()
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
    toast.error('Tindakan gagal. Silakan coba lagi.')
  } finally {
    pending.value = false
  }
}

function onSubmit() {
  void run(() => submitOvertime(overtimeId.value), 'Pengajuan dikirim untuk verifikasi.')
}

function onApprove() {
  void run(() => verifyOvertime(overtimeId.value, 'approved'), 'Pengajuan disetujui.')
}

function onReject() {
  const description = rejectionReason.value.trim()
  if (!description) {
    toast.error('Alasan penolakan wajib diisi.')
    return
  }
  rejecting.value = false
  rejectionReason.value = ''
  void run(() => verifyOvertime(overtimeId.value, 'rejected', description), 'Pengajuan ditolak.')
}

// Absent, not disabled: a control the caller cannot use is never rendered.
const workflowControls = computed<ActionableControl[]>(() => {
  const workflow: ActionableControl[] = []
  if (maySubmit.value) workflow.push({ key: 'submit', label: 'Kirim Verifikasi', loading: pending.value, onSelect: onSubmit })
  if (mayVerify.value) {
    workflow.push({ key: 'approve', label: 'Setujui', loading: pending.value, onSelect: onApprove })
    workflow.push({ key: 'reject', label: 'Tolak', loading: pending.value, onSelect: () => (rejecting.value = true) })
  }
  return workflow
})

/**
 * The workflow controls ride along as `extra`, so the standard set still comes
 * from the resource. The record is handed over for the access policy and back
 * through `data`, keeping this screen at one fetch.
 */
const view = computed(() => {
  const surface = overtimes.detail({
    id: overtimeId.value,
    record: record.value,
    controls: { extra: workflowControls.value },
  })
  return { ...surface, detail: { ...surface.detail, data: record.value } }
})

function onBack() {
  void router.push(overtimes.actions.list!.to as never)
}
</script>

<template>
  <div>
    <DetailView title="Detail Lembur" v-bind="view" />

    <section v-if="rejecting" data-reject-dialog>
      <label for="rejection-reason">Alasan penolakan</label>
      <textarea id="rejection-reason" v-model="rejectionReason" data-rejection-reason></textarea>
      <button type="button" data-confirm-reject @click="onReject">Tolak Pengajuan</button>
      <button type="button" data-cancel-reject @click="rejecting = false">Batal</button>
    </section>

    <ListView title="Riwayat Verifikasi" :table="stepsTable" />

    <button type="button" data-back @click="onBack">Kembali</button>
  </div>
</template>
