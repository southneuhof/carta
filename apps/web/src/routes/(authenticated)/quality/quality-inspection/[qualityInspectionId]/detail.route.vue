<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { DetailView, Detail, DialogForm, Table, useLoader, recordKey } from '@southneuhof/is-vue-framework'
import { Button, Card, Chip, Icon, ImagePreview, Timeline } from '@southneuhof/is-vue-framework/components/base'
import { fileUrl } from '@/framework/adapters/storage'
import { qualityInspection, qualityInspectionFields } from '../quality-inspection.resource'
import { qualityInspectionActions } from '../quality-inspection.actions'
import { acceptanceCriteriaLabels, itpTypeLabels, resultColors, resultLabels, resultOptions, statusColors, statusLabels } from '../quality-inspection.schema'
import { itpActions } from '../../inspection-test-plans/itp.actions'
import { codeLabel, stepLabels as ptsStepLabels } from '../../pts/pts.schema'
import QualityInspectionDocumentationForm from '../QualityInspectionDocumentationForm.vue'
import QualityInspectionEvidenceExport from '../QualityInspectionEvidenceExport.vue'

const route = useRoute('quality-quality-inspection-detail')
const id = String(route.params.qualityInspectionId)
const detailAction = qualityInspection.detail({ id })
const loaded = useLoader({
  key: recordKey({ resource: detailAction.namespace, id: detailAction.id, searchParameters: detailAction.searchParameters }),
  context: { id: detailAction.id, searchParameters: detailAction.searchParameters },
  load: detailAction.run,
})
const record = computed(() => loaded.data.value as Record<string, any> | undefined)
const documentationNames = ['sudut 1', 'sudut 2', 'sudut 3', 'sudut 4'] as const
const documentationInitial = computed(() => {
  const byName = new Map<string, Record<string, any>>()
  for (const documentation of record.value?.documentations ?? []) byName.set(documentation.name, documentation)
  return Object.fromEntries(
    documentationNames.flatMap((name) => {
      const documentation = byName.get(name)
      return [
        [name, documentation?.fileAttachment ?? ''],
        [`${name}Description`, documentation?.description ?? ''],
      ]
    })
  )
})
const documentationGallery = computed(() =>
  documentationNames.map((name) => {
    const documentation = (record.value?.documentations ?? []).find((item: Record<string, any>) => item.name === name)
    return {
      name,
      url: typeof documentation?.fileAttachment === 'string' && documentation.fileAttachment ? fileUrl(documentation.fileAttachment) : undefined,
      description: typeof documentation?.description === 'string' ? documentation.description : '',
    }
  })
)
const showDocumentation = computed(() => ['inspected', 'submitted', 'close'].includes(String(record.value?.stepCode)))
const showDocumentationForm = computed(() => record.value?.stepCode === 'inspected' && can('submitDocumentations'))
const activeAction = ref<string>()
const actionOpen = ref(false)
const dialogKey = ref(0)
const submitting = ref(false)
const itemResult = ref<'approved' | 'rejected'>('approved')
const inspectionPointOptions = ref<Array<{ id: string; name: string }>>([])
const inspectionPointLoading = ref(false)
const inspectionPointError = ref<string>()

const detailFields = [
  qualityInspectionFields.number,
  qualityInspectionFields.divisionId,
  qualityInspectionFields.projectId,
  qualityInspectionFields.targetDate,
  qualityInspectionFields.qualityWorkCategoryId,
  qualityInspectionFields.workItemCategoryId,
  qualityInspectionFields.locationZone,
  qualityInspectionFields.createdByName,
  qualityInspectionFields.statusCode,
  qualityInspectionFields.stepCode,
  qualityInspectionFields.resultCode,
  qualityInspectionFields.verificationDescription,
]
const scheduleFields = [qualityInspectionFields.scheduleId, qualityInspectionFields.scheduleStartDate, qualityInspectionFields.scheduleEndDate]
const procedureFields = [qualityInspectionFields.inspectionPointCode, qualityInspectionFields.workMethod]
const itemFields = {
  item: { label: 'Item Pekerjaan', read: (row: any) => row.workItem?.name ?? '—' },
  volume: { label: 'Volume', read: (row: any) => `${row.row?.volume ?? '—'}${row.workItem?.uomName ? ` ${row.workItem.uomName}` : ''}` },
  materialCriteria: { label: acceptanceCriteriaLabels.material, read: (row: any) => criteriaFor(row, 'material') },
  processCriteria: { label: acceptanceCriteriaLabels.process, read: (row: any) => criteriaFor(row, 'process') },
  productCriteria: { label: acceptanceCriteriaLabels.product, read: (row: any) => criteriaFor(row, 'product') },
  result: { label: 'Hasil Inspeksi', read: (row: any) => itemResultLabel(row.row?.statusCode) },
  pts: { label: 'PTS', read: (row: any) => row.pts?.number ?? '—' },
}
const itemHistoryFields = {
  item: { label: 'Item Pekerjaan', read: (event: any) => event.itemName ?? '—' },
  result: { label: 'Hasil Inspeksi', read: (event: any) => itemResultLabel(event.resultCode) },
  actor: { label: 'Pelaksana', read: (event: any) => event.verifierName ?? event.verifierId ?? '—' },
  verifiedAt: { label: 'Tanggal / Waktu', read: (event: any) => event.verifiedAt ?? '—' },
  description: { label: 'Catatan', read: (event: any) => event.description ?? '—' },
}
const ptsHistoryFields = {
  item: { label: 'Item Pekerjaan', read: (event: any) => event.itemName ?? '—' },
  pts: { label: 'PTS', read: (event: any) => event.ptsNumber ?? '—' },
  result: { label: 'Hasil', read: () => 'Ditolak' },
  actor: { label: 'Pelaksana', read: (event: any) => event.rejectingUserName ?? event.rejectingUserId ?? '—' },
  rejectedAt: { label: 'Tanggal / Waktu', read: (event: any) => event.rejectedAt ?? '—' },
  note: { label: 'Catatan', read: (event: any) => event.note ?? '—' },
}
const snapshotFields = {
  type: { label: 'Metode Inspeksi', read: (snapshot: any) => snapshotTypeLabel(snapshot.type) },
  criteria: { label: 'Kriteria/Tolok Ukur Penerimaan' },
  procedureCode: { label: 'Kode Prosedur' },
  specification: { label: 'Spesifikasi' },
  method: { label: 'Metode' },
  frequency: { label: 'Frekuensi' },
  description: { label: 'Deskripsi' },
}
const inspectorFields = { inspectorTypeName: { label: 'Jenis Inspektor' } }
const snapshotPointFields = {
  inspectionPointName: { label: 'Inspection Point', read: (point: any) => point.inspectionPointName ?? point.inspectionPointCode ?? '—' },
  value: { label: 'Nilai', read: (point: any) => Boolean(point.value) },
}
const completeReportFields = computed(() => ({
  inspectionPointCode: { label: 'Inspection Point', form: { renderer: 'radio', source: inspectionPointOptions.value, props: { required: true, direction: 'column' } } },
  workMethod: { label: 'Prosedur / Metode Kerja', form: { renderer: 'textarea', props: { required: true } } },
}))
const actionPresentation = {
  completeReport: {
    serverAction: 'complete-report',
    label: 'Lengkapi Prosedur & Penyelesaian',
    fields: completeReportFields,
  },
  verifyWorkItem: {
    serverAction: 'verify-work-item',
    label: 'Verifikasi Item',
    fields: { description: { label: 'Catatan', form: { renderer: 'textarea' } } },
  },
  submitDocumentations: { serverAction: 'documentation', label: 'Submit Inspection Data' },
  verifyReport: {
    serverAction: 'verify',
    label: 'Verifikasi Laporan',
    fields: {
      resultCode: { label: 'Hasil Inspeksi', form: { renderer: 'radio', source: resultOptions, props: { required: true } } },
      description: { label: 'Catatan', form: { renderer: 'textarea' } },
    },
  },
  approve: { label: 'Terima', resultCode: 'approved' as const },
  reject: { label: 'Tolak', resultCode: 'rejected' as const },
} as const
const dialogFields = computed(() => {
  if (activeAction.value === 'completeReport') return actionPresentation.completeReport.fields.value
  if (activeAction.value === 'verifyReport') return actionPresentation.verifyReport.fields
  if (activeAction.value?.startsWith('verify:')) return actionPresentation.verifyWorkItem.fields
  return {}
})
const dialogDescription = computed(() => {
  if (activeAction.value !== 'completeReport') return undefined
  if (inspectionPointLoading.value) return 'Memuat Inspection Point...'
  if (inspectionPointError.value) return `Inspection Point tidak dapat dimuat: ${inspectionPointError.value}`
  if (!inspectionPointOptions.value.length) return 'Tidak ada Inspection Point aktif.'
  return 'Pilih Inspection Point aktif.'
})
const dialogDisabled = computed(
  () => submitting.value || (activeAction.value === 'completeReport' && (inspectionPointLoading.value || Boolean(inspectionPointError.value) || !inspectionPointOptions.value.length))
)
const allowedActions = computed(() => (Array.isArray(record.value?.allowedActions) ? (record.value.allowedActions as string[]) : []))

async function loadInspectionPointOptions() {
  inspectionPointOptions.value = []
  inspectionPointError.value = undefined
  inspectionPointLoading.value = true
  try {
    const projectId = String(record.value?.projectId ?? '')
    if (!projectId) throw new Error('Project laporan tidak tersedia.')
    const template = await itpActions.loadTemplate(projectId)
    inspectionPointOptions.value = template.inspectionPoints.filter((point) => (point as { active?: boolean }).active !== false).map((point) => ({ id: point.code, name: point.name }))
  } catch (error) {
    inspectionPointError.value = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.'
  } finally {
    inspectionPointLoading.value = false
  }
}

function open(action: string) {
  activeAction.value = action
  dialogKey.value += 1
  actionOpen.value = true
  if (action === 'completeReport') void loadInspectionPointOptions()
}
function openItem(row: Record<string, any>, result: 'approved' | 'rejected') {
  itemResult.value = result
  open(`verify:${row.row.id}`)
}
function actionLabel(action: string) {
  return action.startsWith('verify:')
    ? actionPresentation.verifyWorkItem.label
    : action === 'completeReport'
    ? actionPresentation.completeReport.label
    : action === 'verifyReport'
    ? actionPresentation.verifyReport.label
    : action === 'submitDocumentations'
    ? actionPresentation.submitDocumentations.label
    : action
}
function can(action: 'completeReport' | 'submitDocumentations' | 'verifyReport') {
  return allowedActions.value.includes(actionPresentation[action].serverAction)
}
function canItem(row: Record<string, any>, action: string) {
  return allowedActions.value.includes(action) && Array.isArray(row.allowedActions) && row.allowedActions.includes(action)
}
function statusLabel(value: unknown) {
  return statusLabels[String(value)] ?? String(value ?? '—')
}
function statusColor(value: unknown): 'info' | 'warning' | 'success' {
  return statusColors[String(value)] ?? 'info'
}
function resultLabel(value: unknown) {
  return resultLabels[String(value)] ?? String(value ?? '—')
}
function itemResultLabel(value: unknown) {
  return value === 'waiting' ? 'Menunggu' : resultLabel(value)
}
function resultColor(value: unknown): 'success' | 'error' | 'warning' {
  return resultColors[String(value)] ?? 'warning'
}
function rowForVerification(value: string) {
  return (record.value?.workItems ?? []).find((item: Record<string, any>) => `verify:${item.row.id}` === value)
}
function itemVerifications(row: Record<string, any>) {
  return Array.isArray(row.verifications) ? row.verifications : []
}
const itemHistory = computed(() =>
  (record.value?.workItems ?? []).flatMap((item: Record<string, any>) =>
    itemVerifications(item).map((event: Record<string, any>) => ({ ...event, itemName: item.workItem?.name ?? item.workItem?.code ?? '—' }))
  )
)
const ptsHistory = computed(() =>
  (record.value?.workItems ?? []).flatMap((item: Record<string, any>) =>
    (record.value?.ptsRejections ?? [])
      .filter((event: Record<string, any>) => event.qualityInspectionWorkItemItpId === item.row?.id)
      .map((event: Record<string, any>) => ({ ...event, itemName: item.workItem?.name ?? item.workItem?.code ?? '—', ptsNumber: item.pts?.number ?? '—' }))
  )
)
function snapshotTypeLabel(value: unknown) {
  return itpTypeLabels[String(value)] ?? String(value ?? '—')
}
const ptsStatusLabels: Record<string, string> = { open: 'Open', 'on-progress': 'In progress', close: 'Closed' }
const ptsStatusColors: Record<string, 'info' | 'warning' | 'success'> = { open: 'info', 'on-progress': 'warning', close: 'success' }
function ptsStatusLabel(value: unknown) {
  return ptsStatusLabels[String(value)] ?? codeLabel(value)
}
function ptsStatusColor(value: unknown) {
  return ptsStatusColors[String(value)] ?? 'info'
}
function ptsStepLabel(value: unknown) {
  return codeLabel(value, ptsStepLabels)
}
function ptsRoute(value: Record<string, unknown>) {
  return { name: 'quality-pts-detail', params: { ptsId: String(value.id) } } as const
}
function snapshotsOf(row: Record<string, any>, type: string) {
  return (Array.isArray(row.snapshots) ? row.snapshots : []).filter((snapshot: Record<string, any>) => snapshot.type === type)
}
function criteriaFor(row: Record<string, any>, type: string) {
  return snapshotsOf(row, type)
    .map((snapshot: Record<string, any>) => snapshot.criteria)
    .filter((criteria: unknown): criteria is string => typeof criteria === 'string' && criteria.trim().length > 0)
}
function image(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'object' && value !== null && typeof (value as { url?: unknown }).url === 'string') return (value as { url: string }).url
  return typeof value === 'string' ? fileUrl(value) : undefined
}

async function refresh() {
  await qualityInspection.invalidate({ id })
  await loaded.refresh()
}

async function submitAction(input: Record<string, unknown>) {
  if (submitting.value || !activeAction.value) return input
  if (activeAction.value === 'completeReport' && (inspectionPointLoading.value || !inspectionPointOptions.value.length)) return input
  const action = activeAction.value
  submitting.value = true
  try {
    if (action === 'completeReport') await qualityInspectionActions.completeReport(id, input as never)
    if (action === 'verifyReport') await qualityInspectionActions.verifyReport(id, input as never)
    await refresh()
    toast.success(`Inspection/Test ${actionLabel(action)} selesai.`)
    actionOpen.value = false
    activeAction.value = undefined
  } catch (error) {
    toast.error(error instanceof Error ? error.message : `Inspection/Test ${actionLabel(action)} gagal.`)
    throw error
  } finally {
    submitting.value = false
  }
  return input
}

async function submitItem(row: Record<string, any>, input: Record<string, unknown>) {
  if (submitting.value) return input
  const submission = { ...input, resultCode: itemResult.value }
  submitting.value = true
  try {
    await qualityInspectionActions.verifyWorkItem(id, row.row.id, submission as never)
    await refresh()
    actionOpen.value = false
    activeAction.value = undefined
    toast.success(`Inspection/Test ${actionPresentation.verifyWorkItem.label} selesai.`)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : `Inspection/Test ${actionPresentation.verifyWorkItem.label} gagal.`)
    throw error
  } finally {
    submitting.value = false
  }
  return submission
}

async function submitDocumentations(input: Record<string, unknown>) {
  if (submitting.value) return input
  submitting.value = true
  try {
    const result = await qualityInspectionActions.submitDocumentations(id, input as never)
    toast.success(`Inspection/Test ${actionPresentation.submitDocumentations.label} selesai.`)
    return result
  } catch (error) {
    toast.error(error instanceof Error ? error.message : `Inspection/Test ${actionPresentation.submitDocumentations.label} gagal.`)
    throw error
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <DetailView :detail="{ fields: detailFields as never, data: record }" title="Detail Laporan" :back-to="{ name: 'quality-quality-inspection' }">
      <template #value:statusCode="{ value }"
        ><Chip variant="tonal" :color="statusColor(value)">{{ statusLabel(value) }}</Chip></template
      >
      <template #value:resultCode="{ value }"
        ><Chip v-if="value" variant="tonal" :color="resultColor(value)">{{ resultLabel(value) }}</Chip
        ><span v-else>—</span></template
      >
      <template #controls><QualityInspectionEvidenceExport v-if="record" :record="record" /></template>
    </DetailView>

    <template v-if="record">
      <Card v-if="record.scheduleId" variant="outlined" color="surfaceContainer" class="gap-0 p-0"
        ><header class="border-b border-outline-variant px-5 py-4">
          <h2 class="font-semibold">Asal Jadwal</h2>
          <p class="mt-1 text-sm text-on-surface-variant">Periode tersimpan pada saat laporan dibuat.</p>
        </header>
        <div class="p-5"><Detail :fields="scheduleFields as never" :data="record" /></div
      ></Card>
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"
        ><header class="flex items-center justify-between gap-2 border-b border-outline-variant px-5 py-4">
          <h2 class="font-semibold">Prosedur &amp; Penyelesaian</h2>
          <Button v-if="can('completeReport')" type="button" :disabled="submitting" @click="open('completeReport')">{{ actionPresentation.completeReport.label }}</Button>
        </header>
        <div v-if="record.stepCode !== 'report'" class="p-5"><Detail :fields="procedureFields as never" :data="record" /></div>
        <p v-else class="p-5 text-sm text-on-surface-variant">Prosedur dan penyelesaian belum dilengkapi.</p></Card
      >
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
        <header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">Daftar Item Pekerjaan</h2></header>
        <Table :data="record.workItems ?? []" :fields="itemFields" :pagination="false" row-key="row.id">
          <template #cell:materialCriteria="{ record: row }"
            ><ol v-if="criteriaFor(row, 'material').length" class="list-decimal ps-5 text-start">
              <li v-for="criteria in criteriaFor(row, 'material')" :key="criteria">{{ criteria }}</li>
            </ol>
            <span v-else aria-label="Tidak ada kriteria">—</span></template
          >
          <template #cell:processCriteria="{ record: row }"
            ><ol v-if="criteriaFor(row, 'process').length" class="list-decimal ps-5 text-start">
              <li v-for="criteria in criteriaFor(row, 'process')" :key="criteria">{{ criteria }}</li>
            </ol>
            <span v-else aria-label="Tidak ada kriteria">—</span></template
          >
          <template #cell:productCriteria="{ record: row }"
            ><ol v-if="criteriaFor(row, 'product').length" class="list-decimal ps-5 text-start">
              <li v-for="criteria in criteriaFor(row, 'product')" :key="criteria">{{ criteria }}</li>
            </ol>
            <span v-else aria-label="Tidak ada kriteria">—</span></template
          >
          <template #cell:pts="{ record: row }"
            ><div v-if="row.pts" class="flex min-w-48 flex-col gap-1">
              <RouterLink data-testid="pts-link" :to="ptsRoute(row.pts)" class="font-medium text-primary underline-offset-2 hover:underline">{{ row.pts.number }}</RouterLink>
              <div class="flex flex-wrap items-center gap-2">
                <Chip variant="tonal" :color="ptsStatusColor(row.pts.statusCode)">{{ ptsStatusLabel(row.pts.statusCode) }}</Chip
                ><span class="text-sm text-on-surface-variant">{{ ptsStepLabel(row.pts.stepCode) }}</span>
              </div>
            </div>
            <span v-else>—</span></template
          >
          <template #cell:result="{ record: row }">
            <div class="min-w-[22rem] space-y-3">
              <Chip variant="tonal" :color="resultColor(row.row?.statusCode)">{{ itemResultLabel(row.row?.statusCode) }}</Chip>
              <Timeline v-if="itemVerifications(row).length" :data="itemVerifications(row)">
                <template #node><span class="size-2 rounded-full bg-primary" /></template>
                <template #header="{ data }">
                  <div class="flex flex-wrap items-center gap-2">
                    <Chip variant="tonal" :color="resultColor(data.resultCode)">{{ itemResultLabel(data.resultCode) }}</Chip>
                    <span class="text-sm">Inspeksi dilakukan oleh {{ data.verifierName ?? data.verifierId ?? '—' }} pada {{ data.verifiedAt }}</span>
                  </div>
                </template>
                <template #content="{ data }">
                  <span v-if="data.description" class="text-sm italic">"{{ data.description }}"</span>
                  <span v-else class="text-sm text-on-surface-variant">Tidak ada catatan</span>
                </template>
              </Timeline>
              <p v-else class="text-sm text-on-surface-variant">Belum ada riwayat inspeksi.</p>
            </div>
          </template>
          <template #row-actions="{ record: row }"
            ><div v-if="canItem(row, actionPresentation.verifyWorkItem.serverAction)" class="flex gap-1">
              <Button type="button" variant="tonal" :disabled="submitting" @click.stop="openItem(row, actionPresentation.approve.resultCode)">{{ actionPresentation.approve.label }}</Button
              ><Button type="button" variant="tonal" color="error" :disabled="submitting" @click.stop="openItem(row, actionPresentation.reject.resultCode)">{{
                actionPresentation.reject.label
              }}</Button>
            </div></template
          >
        </Table>
      </Card>
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"
        ><header class="border-b border-outline-variant px-5 py-4">
          <h2 class="font-semibold">Data ITP Tersimpan</h2>
          <p class="mt-1 text-sm text-on-surface-variant">Nilai disimpan pada saat laporan dibuat.</p>
        </header>
        <div class="divide-y divide-outline-variant">
          <section v-for="item in record.workItems ?? []" :key="`snapshot-${item.row.id}`" class="p-5">
            <h3 class="font-medium">{{ item.workItem?.name }}</h3>
            <p v-if="!item.snapshots?.length" class="mt-2 text-sm text-on-surface-variant">Tidak ada data ITP tersimpan.</p>
            <div v-else class="mt-4 flex flex-col gap-4">
              <article v-for="snapshot in item.snapshots" :key="snapshot.id" class="rounded-lg border border-outline-variant p-4">
                <div class="mb-3 flex items-center gap-2">
                  <Chip variant="tonal" color="info">{{ snapshotTypeLabel(snapshot.type) }}</Chip>
                </div>
                <Detail :fields="snapshotFields as never" :data="snapshot" />
                <div v-if="image(snapshot.imgDocumentation)" class="mt-4 max-w-sm">
                  <p class="mb-2 text-sm font-medium">Foto Dokumentasi</p>
                  <ImagePreview :image-u-r-l="image(snapshot.imgDocumentation)" :disable-controls="true" class="aspect-video w-full" />
                </div>
                <p v-else class="mt-4 text-sm text-on-surface-variant">Foto Dokumentasi: —</p>
                <div v-for="inspector in snapshot.inspectors ?? []" :key="inspector.id" class="mt-4 border-t border-outline-variant pt-4">
                  <Detail :fields="inspectorFields as never" :data="inspector" /><Table
                    v-if="inspector.points?.length"
                    class="mt-3"
                    :data="inspector.points"
                    :fields="snapshotPointFields"
                    :pagination="false"
                    ><template #cell:value="{ value }"
                      ><Chip :variant="value ? 'tonal' : 'outline'" :color="value ? 'success' : 'error'">{{ value ? 'Ya' : 'Tidak' }}</Chip></template
                    ></Table
                  >
                  <p v-else class="mt-2 text-sm text-on-surface-variant">Tidak ada Inspection Point.</p>
                </div>
              </article>
            </div>
          </section>
        </div></Card
      >
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0"
        ><header class="border-b border-outline-variant px-5 py-4"><h2 class="font-semibold">Riwayat PTS &amp; Penolakan</h2></header>
        <div class="divide-y divide-outline-variant">
          <section v-for="item in (record.workItems ?? []).filter((entry: Record<string, any>) => entry.pts)" :key="`pts-${item.row.id}`" class="p-5">
            <div class="flex flex-wrap items-center gap-2 font-medium">
              <span>{{ item.workItem?.name }}</span
              ><span aria-hidden="true">·</span><RouterLink data-testid="pts-link" :to="ptsRoute(item.pts)" class="text-primary underline-offset-2 hover:underline">{{ item.pts.number }}</RouterLink
              ><Chip variant="tonal" :color="ptsStatusColor(item.pts.statusCode)">{{ ptsStatusLabel(item.pts.statusCode) }}</Chip
              ><span class="text-sm text-on-surface-variant">{{ ptsStepLabel(item.pts.stepCode) }}</span>
            </div>
            <ul class="mt-2 list-disc ps-5 text-sm">
              <li v-for="event in (record.ptsRejections ?? []).filter((entry: Record<string, any>) => entry.qualityInspectionWorkItemItpId === item.row.id)" :key="event.id">
                {{ event.note || 'Ditolak' }} · {{ event.rejectedAt }}
              </li>
            </ul>
          </section>
          <p v-if="!(record.workItems ?? []).some((entry: Record<string, any>) => entry.pts)" class="p-5 text-sm text-on-surface-variant">Tidak ada PTS terkait.</p>
        </div></Card
      >
      <template v-if="showDocumentation">
        <QualityInspectionDocumentationForm
          v-if="showDocumentationForm"
          :initial="documentationInitial"
          :submit="submitDocumentations"
          :submit-label="actionPresentation.submitDocumentations.label"
          @submitted="refresh"
        />
        <Card v-else data-testid="documentation-gallery" variant="outlined" color="surfaceContainer" class="gap-0 p-0">
          <header class="border-b border-outline-variant px-5 py-4">
            <h2 class="font-semibold">Foto Sudut Pengambilan</h2>
            <p class="mt-1 text-sm text-on-surface-variant">Dokumentasi yang tersimpan pada laporan.</p>
          </header>
          <div class="grid gap-2 p-5 sm:grid-cols-2">
            <article v-for="documentation in documentationGallery" :key="documentation.name" class="rounded-lg border border-outline-variant p-3">
              <p class="mb-2 text-sm font-medium">{{ documentation.name }}</p>
              <ImagePreview v-if="documentation.url" :image-u-r-l="documentation.url" :disable-controls="true" class="aspect-video w-full" />
              <p v-else class="flex aspect-video items-center justify-center rounded-lg bg-surface-container-high text-sm text-on-surface-variant">Dokumentasi belum tersedia.</p>
              <p class="mt-3 text-sm"><span class="font-medium">Catatan:</span> {{ documentation.description || '—' }}</p>
            </article>
          </div>
        </Card>
      </template>
      <Card v-if="can('verifyReport')" variant="outlined" color="surfaceContainer" class="gap-0 p-0"
        ><header class="border-b border-outline-variant px-5 py-4">
          <h2 class="font-semibold">{{ actionPresentation.verifyReport.label }}</h2>
          <p class="mt-1 text-sm text-on-surface-variant">Pilih hasil verifikasi laporan.</p>
        </header>
        <div class="p-5">
          <Button type="button" :disabled="submitting" @click="open('verifyReport')">{{ actionPresentation.verifyReport.label }}</Button>
        </div></Card
      >
      <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
        <header class="border-b border-outline-variant px-5 py-4">
          <h2 class="font-semibold">Riwayat Audit</h2>
          <p class="mt-1 text-sm text-on-surface-variant">Semua aktivitas, hasil inspeksi item, verifikasi laporan, dan penolakan PTS.</p>
        </header>
        <div class="divide-y divide-outline-variant">
          <section class="p-5">
            <h3 class="font-medium">Aktivitas</h3>
            <Timeline v-if="record.activity?.length" class="mt-3" :data="record.activity">
              <template #node><span class="size-2 rounded-full bg-primary" /></template>
              <template #header="{ data }"
                ><div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium">{{ data.shortDescription }}</span
                  ><span class="text-sm text-on-surface-variant">oleh {{ data.actorName ?? data.actorUserId ?? '—' }}</span>
                </div></template
              >
              <template #content="{ data }"
                ><div class="text-sm text-on-surface-variant">{{ data.createdAt }}</div>
                <div v-if="data.description" class="mt-1 text-sm">{{ data.description }}</div>
                <div v-else class="mt-1 text-sm text-on-surface-variant">Tidak ada catatan</div></template
              >
            </Timeline>
            <p v-else class="mt-3 text-sm text-on-surface-variant">Belum ada aktivitas.</p>
          </section>
          <section class="p-5">
            <h3 class="font-medium">Riwayat Inspeksi Item</h3>
            <Table v-if="itemHistory.length" class="mt-3" :data="itemHistory" :fields="itemHistoryFields" :pagination="false" row-key="id">
              <template #cell:result="{ record: event }"
                ><Chip variant="tonal" :color="resultColor(event.resultCode)">{{ itemResultLabel(event.resultCode) }}</Chip></template
              >
            </Table>
            <p v-else class="mt-3 text-sm text-on-surface-variant">Belum ada riwayat verifikasi item.</p>
          </section>
          <section class="p-5">
            <h3 class="font-medium">Riwayat Hasil Laporan</h3>
            <Timeline v-if="record.verifications?.length" class="mt-3" :data="record.verifications">
              <template #node><span class="size-2 rounded-full bg-primary" /></template>
              <template #header="{ data }"
                ><div class="flex flex-wrap items-center gap-2">
                  <Chip variant="tonal" :color="resultColor(data.resultCode)">{{ resultLabel(data.resultCode) }}</Chip
                  ><span class="text-sm">oleh {{ data.verifierName ?? data.verifierId ?? '—' }}</span>
                </div></template
              >
              <template #content="{ data }"
                ><div class="text-sm text-on-surface-variant">{{ data.verifiedAt }}</div>
                <div v-if="data.description" class="mt-1 text-sm">{{ data.description }}</div>
                <div v-else class="mt-1 text-sm text-on-surface-variant">Tidak ada catatan</div></template
              >
            </Timeline>
            <p v-else class="mt-3 text-sm text-on-surface-variant">Belum ada riwayat verifikasi laporan.</p>
          </section>
          <section class="p-5">
            <h3 class="font-medium">Riwayat Penolakan PTS</h3>
            <Table v-if="ptsHistory.length" class="mt-3" :data="ptsHistory" :fields="ptsHistoryFields" :pagination="false" row-key="id">
              <template #cell:result><Chip variant="tonal" color="error">Ditolak</Chip></template>
            </Table>
            <p v-else class="mt-3 text-sm text-on-surface-variant">Belum ada riwayat penolakan PTS.</p>
          </section>
        </div>
      </Card>

      <DialogForm
        v-if="activeAction && !activeAction.startsWith('verify:') && activeAction !== 'documentation'"
        :key="`${activeAction}-${dialogKey}`"
        v-model:open="actionOpen"
        :title="actionLabel(activeAction)"
        :description="dialogDescription"
        :fields="dialogFields as never"
        :submit="submitAction as never"
        :disabled="dialogDisabled"
      />
      <DialogForm
        v-if="activeAction?.startsWith('verify:')"
        :key="activeAction"
        v-model:open="actionOpen"
        :title="actionPresentation.verifyWorkItem.label"
        :fields="actionPresentation.verifyWorkItem.fields as never"
        :submit="(input) => submitItem(rowForVerification(activeAction!), input) as never"
        :disabled="submitting"
      />
    </template>
  </div>
</template>
