<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, Detail, DialogForm, Table, useLoader, recordKey } from '@southneuhof/is-vue-framework'
import { Button, Card, Icon, Timeline } from '@southneuhof/is-vue-framework/components/base'
import { qualityInspection, qualityInspectionFields } from '../quality-inspection.resource'
import { qualityInspectionActions } from '../quality-inspection.actions'
import { resultOptions, statusOptions, stepLabels } from '../quality-inspection.schema'
import QualityInspectionDocumentationForm from '../QualityInspectionDocumentationForm.vue'
import QualityInspectionEvidenceExport from '../QualityInspectionEvidenceExport.vue'

const route = useRoute('quality-quality-inspection-detail')
const id = String(route.params.qualityInspectionId)
const detailAction = qualityInspection.detail({ id })
const loaded = useLoader({ key: recordKey({ resource: detailAction.namespace, id: detailAction.id, searchParameters: detailAction.searchParameters }), context: { id: detailAction.id, searchParameters: detailAction.searchParameters }, load: detailAction.run })
const record = computed(() => loaded.data.value as Record<string, any> | undefined)
const activeAction = ref<string>()
const actionOpen = ref(false)
const submitting = ref(false)
const itemResult = ref<'approved' | 'rejected'>('approved')

const detailFields = [qualityInspectionFields.number, qualityInspectionFields.divisionId, qualityInspectionFields.projectId, qualityInspectionFields.targetDate, qualityInspectionFields.qualityWorkCategoryId, qualityInspectionFields.workItemCategoryId, qualityInspectionFields.locationZone, qualityInspectionFields.scheduleId, qualityInspectionFields.scheduleStartDate, qualityInspectionFields.scheduleEndDate, qualityInspectionFields.statusCode, qualityInspectionFields.stepCode]
const itemFields = {
  item: { label: 'Item Pekerjaan', read: (row: any) => row.workItem?.name ?? '—' },
  volume: { label: 'Volume', read: (row: any) => row.row?.volume ?? '—' },
  result: { label: 'Hasil', read: (row: any) => resultOptions.find((option) => option.id === row.row?.statusCode)?.name ?? row.row?.statusCode ?? 'Waiting' },
  pts: { label: 'PTS', read: (row: any) => row.pts ? `${row.pts.number} · ${row.pts.statusCode}` : '—' },
}
const actionLabels: Record<string, string> = { completeReport: 'Lengkapi Prosedur & Penyelesaian', verifyWorkItem: 'Verifikasi Item', submitDocumentations: 'Submit Inspection Data', verifyReport: 'Verifikasi Laporan' }
const serverActionNames: Record<string, string> = { completeReport: 'complete-report', verifyWorkItem: 'verify-work-item', documentation: 'documentation', submitDocumentations: 'documentation', verifyReport: 'verify' }
const actionFields = {
  completeReport: { inspectionPointCode: { label: 'Inspection Point', form: { renderer: 'text', props: { required: true } } }, workMethod: { label: 'Prosedur / Metode Kerja', form: { renderer: 'textarea', props: { required: true } } } },
  verifyWorkItem: { resultCode: { label: 'Hasil', form: { renderer: 'radio', source: [{ id: 'approved', name: 'Diterima' }, { id: 'rejected', name: 'Ditolak' }], props: { required: true } } }, description: { label: 'Catatan', form: { renderer: 'textarea' } } },
  verifyReport: { resultCode: { label: 'Hasil', form: { renderer: 'radio', source: resultOptions, props: { required: true } } }, description: { label: 'Catatan', form: { renderer: 'textarea' } } },
}
const dialogFields = computed(() => actionFields[activeAction.value as keyof typeof actionFields] ?? {})
const allowedActions = computed(() => Array.isArray(record.value?.allowedActions) ? record.value.allowedActions as string[] : [])

function open(action: string) { activeAction.value = action; actionOpen.value = true }
function openItem(row: Record<string, any>, result: 'approved' | 'rejected') {
  itemResult.value = result
  open(`verify:${row.row.id}`)
}
function can(action: string) { return allowedActions.value.includes(serverActionNames[action] ?? action) }
function canItem(row: Record<string, any>, action: string) { return Array.isArray(row.allowedActions) && row.allowedActions.includes(action) }
function status(value: unknown) { return statusOptions.find((option) => option.id === value)?.name ?? String(value ?? '—') }
function step(value: unknown) { return stepLabels[String(value)] ?? String(value ?? '—') }
function rowForVerification(value: string) { return (record.value?.workItems ?? []).find((item: Record<string, any>) => `verify:${item.row.id}` === value) }

async function refresh() {
  await qualityInspection.invalidate({ id })
  await loaded.refresh()
}

async function submitAction(input: Record<string, unknown>) {
  if (submitting.value || !activeAction.value) return input
  submitting.value = true
  try {
    if (activeAction.value === 'completeReport') await qualityInspectionActions.completeReport(id, input as never)
    if (activeAction.value === 'verifyReport') await qualityInspectionActions.verifyReport(id, input as never)
    await refresh()
    toast.success(`Inspection/Test ${actionLabels[activeAction.value]} selesai.`)
    actionOpen.value = false
    activeAction.value = undefined
  } finally { submitting.value = false }
  return input
}

async function submitItem(row: Record<string, any>, input: Record<string, unknown>) {
  if (submitting.value) return input
  submitting.value = true
  try { await qualityInspectionActions.verifyWorkItem(id, row.row.id, input as never); await refresh(); actionOpen.value = false; activeAction.value = undefined; toast.success('Inspection/Test item selesai.') } finally { submitting.value = false }
  return input
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <DetailView :detail="{ fields: detailFields as never, data: record }" title="Detail Laporan" :back-to="{ name: 'quality-quality-inspection' }">
      <template #controls><QualityInspectionEvidenceExport v-if="record" :record="record" /></template>
    </DetailView>

    <template v-if="record">
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">Detail Laporan</h2><p class="mt-1 text-sm text-on-surface-variant">{{ status(record.statusCode) }} · {{ step(record.stepCode) }}</p></header><div class="p-5"><Detail :fields="detailFields as never" :data="record" /></div></Card>
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">Prosedur &amp; Penyelesaian</h2></header><p class="p-5 whitespace-pre-wrap">{{ record.workMethod || '—' }}</p></Card>
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">Daftar Item Pekerjaan</h2></header><Table :data="record.workItems ?? []" :fields="itemFields" :pagination="false" row-key="row.id"><template #row-actions="{ record: row }"><div v-if="canItem(row, 'verify-work-item')" class="flex gap-1"><Button type="button" variant="tonal" :disabled="submitting" @click.stop="openItem(row, 'approved')">Terima</Button><Button type="button" variant="tonal" color="error" :disabled="submitting" @click.stop="openItem(row, 'rejected')">Tolak</Button></div></template></Table></Card>
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">ITP Snapshot</h2></header><div class="divide-y divide-outline-variant"><section v-for="item in record.workItems ?? []" :key="`snapshot-${item.row.id}`" class="p-5"><h3 class="font-medium">{{ item.workItem?.name }}</h3><ul class="mt-2 list-disc ps-5 text-sm"><li v-for="snapshot in item.snapshots ?? []" :key="snapshot.id">{{ snapshot.type }} · Criteria: {{ snapshot.criteria || '—' }} · {{ snapshot.procedureCode || '—' }} · {{ snapshot.specification || '—' }}</li><li v-if="!item.snapshots?.length" class="text-on-surface-variant">No snapshot data.</li></ul></section></div></Card>
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">PTS &amp; Rejection History</h2></header><div class="divide-y divide-outline-variant"><section v-for="item in (record.workItems ?? []).filter((entry: Record<string, any>) => entry.pts)" :key="`pts-${item.row.id}`" class="p-5"><p class="font-medium">{{ item.workItem?.name }} · {{ item.pts.number }} · {{ item.pts.statusCode }}</p><ul class="mt-2 list-disc ps-5 text-sm"><li v-for="event in (record.ptsRejections ?? []).filter((entry: Record<string, any>) => entry.qualityInspectionWorkItemItpId === item.row.id)" :key="event.id">{{ event.note || 'Rejected' }} · {{ event.rejectedAt }}</li></ul></section><p v-if="!(record.workItems ?? []).some((entry: Record<string, any>) => entry.pts)" class="p-5 text-sm text-on-surface-variant">No linked PTS.</p></div></Card>
      <QualityInspectionDocumentationForm v-if="can('documentation')" :submit="(input) => qualityInspectionActions.submitDocumentations(id, input)" @submitted="refresh" />
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">History</h2></header><div class="p-5"><Timeline v-if="record.activity?.length" :data="record.activity"><template #header="{ data }"><span>{{ data.shortDescription }}</span></template><template #content="{ data }"><span class="text-sm text-on-surface-variant">{{ data.createdAt }}</span></template></Timeline><ul v-if="record.verifications?.length" class="mt-4 list-disc ps-5 text-sm"><li v-for="event in record.verifications" :key="event.id">{{ event.resultCode }} · {{ event.description || '—' }} · {{ event.verifiedAt }}</li></ul><p v-if="!record.activity?.length && !record.verifications?.length" class="text-sm text-on-surface-variant">No history yet.</p></div></Card>
      <div class="flex flex-wrap gap-2"><Button v-if="can('completeReport')" type="button" :disabled="submitting" @click="open('completeReport')"><template #icon><Icon name="checkbox-circle" /></template>{{ actionLabels.completeReport }}</Button><Button v-if="can('verifyReport')" type="button" :disabled="submitting" @click="open('verifyReport')">{{ actionLabels.verifyReport }}</Button></div>

      <DialogForm v-if="activeAction && !activeAction.startsWith('verify:') && activeAction !== 'documentation'" v-model:open="actionOpen" :title="actionLabels[activeAction]" :fields="dialogFields as never" :submit="submitAction as never" :disabled="submitting" />
      <DialogForm v-if="activeAction?.startsWith('verify:')" :key="activeAction" v-model:open="actionOpen" title="Verifikasi Item" :initial-data="{ resultCode: itemResult }" :fields="actionFields.verifyWorkItem as never" :submit="(input) => submitItem(rowForVerification(activeAction!), input) as never" :disabled="submitting" />
    </template>
  </div>
</template>
