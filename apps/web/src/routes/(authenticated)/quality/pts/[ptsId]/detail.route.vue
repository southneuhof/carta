<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Detail, DialogForm, NavigationHeader, useLoader, recordKey } from '@southneuhof/is-vue-framework'
import { Button, Card, ImagePreview, Timeline } from '@southneuhof/is-vue-framework/components/base'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import { fileUrl } from '@/framework/adapters/storage'
import { pts, ptsActionFields } from '../pts.resource'

const route = useRoute('quality-pts-detail')
const router = useRouter()
const ptsId = String(route.params.ptsId)
const detail = pts.detail({ id: ptsId })
const loaded = useLoader({
  key: recordKey({ resource: detail.namespace, id: detail.id, searchParameters: detail.searchParameters }),
  context: { id: detail.id, searchParameters: detail.searchParameters },
  load: detail.run,
})
const record = computed(() => loaded.data.value as (Record<string, any> | undefined))
const activeAction = ref<string>()
const dialogOpen = ref(false)
const submitting = ref(false)

const actionLabels: Record<string, string> = {
  disposition: 'Disposition',
  'temporary-plan': 'Temporary plan',
  'management-notes': 'Management notes',
  'complete-report': 'Complete report',
  'follow-up-implementation': 'Implementation follow-up',
  'follow-up-price': 'Price follow-up',
  'implementation-report': 'Implementation report',
  'verify-implementation': 'Verify implementation',
  realization: 'Realization',
  close: 'Close',
  delete: 'Delete',
}

const actionFields: Record<string, Record<string, unknown>> = {
  disposition: { dispositionStatusCode: ptsActionFields.dispositionStatusCode },
  'temporary-plan': { temporaryFollowUpPlan: ptsActionFields.temporaryFollowUpPlan },
  'management-notes': { managementNotes: ptsActionFields.managementNotes },
  'complete-report': { somUserId: ptsActionFields.somUserId, followUpPlan: ptsActionFields.followUpPlan, targetDate: ptsActionFields.targetDate },
  'follow-up-implementation': { implementationUserId: ptsActionFields.implementationUserId, workMethod: ptsActionFields.workMethod },
  'follow-up-price': { estimationCost: ptsActionFields.estimationCost, jobImplementorType: ptsActionFields.jobImplementorType, projectVendorId: ptsActionFields.projectVendorId },
  'implementation-report': { implementationDate: ptsActionFields.implementationDate, imgProcess: ptsActionFields.imgProcess, imgAfter: ptsActionFields.imgAfter, implementationDescription: ptsActionFields.implementationDescription },
  'verify-implementation': { implementationStatusCode: ptsActionFields.implementationStatusCode, implementationVerificationDescription: ptsActionFields.implementationVerificationDescription },
  realization: { actualCost: ptsActionFields.actualCost, actualJobImplementorType: ptsActionFields.actualJobImplementorType, actualProjectVendorId: ptsActionFields.actualProjectVendorId },
  delete: { deletedReason: { label: 'Delete reason', form: { renderer: 'textarea', props: { required: true } } } },
}

const dialogFields = computed(() => actionFields[activeAction.value ?? ''] ?? {})
const availableActions = computed(() => Array.isArray(record.value?.availableActions) ? record.value.availableActions as string[] : [])
type DetailSection = { title: string; fields: Record<string, { label: string }> }

function hasValue(row: Record<string, any>, ...keys: string[]) {
  return keys.some((key) => row[key] !== undefined && row[key] !== null && row[key] !== '')
}

const completedSections = computed<DetailSection[]>(() => {
  const row = record.value
  if (!row) return []
  const sections: Array<DetailSection & { visible: boolean }> = [
    { title: 'Disposition', fields: { dispositionStatusCode: { label: 'Disposition' } }, visible: hasValue(row, 'dispositionStatusCode') },
    { title: 'Temporary plan', fields: { temporaryFollowUpPlan: { label: 'Temporary Follow-up Plan' } }, visible: hasValue(row, 'temporaryFollowUpPlan') },
    { title: 'Management notes', fields: { managementNotes: { label: 'Management Notes' } }, visible: hasValue(row, 'managementNotes') },
    { title: 'Complete report', fields: { somUserId: { label: 'SOM User' }, followUpPlan: { label: 'Follow-up Plan' }, targetDate: { label: 'Target Date' } }, visible: hasValue(row, 'somUserId', 'followUpPlan', 'targetDate') },
    { title: 'Implementation follow-up', fields: { implementationUserId: { label: 'Implementation User' }, workMethod: { label: 'Work Method' } }, visible: hasValue(row, 'implementationUserId', 'workMethod') },
    { title: 'Price follow-up', fields: { estimationCost: { label: 'Estimated Cost' }, jobImplementorType: { label: 'Job Implementor' }, projectVendorId: { label: 'Project Vendor' } }, visible: hasValue(row, 'estimationCost', 'jobImplementorType', 'projectVendorId') },
    { title: 'Implementation report', fields: { implementationDate: { label: 'Implementation Date' }, implementationDescription: { label: 'Description' } }, visible: hasValue(row, 'implementationDate', 'imgProcess', 'imgAfter', 'implementationDescription') },
    { title: 'Verification', fields: { implementationStatusCode: { label: 'Verification' }, implementationVerificationDescription: { label: 'Verification Description' } }, visible: hasValue(row, 'implementationStatusCode', 'implementationVerificationDescription') },
    { title: 'Realization', fields: { actualCost: { label: 'Actual Cost' }, actualJobImplementorType: { label: 'Actual Job Implementor' }, actualProjectVendorId: { label: 'Actual Project Vendor' } }, visible: hasValue(row, 'actualCost', 'actualJobImplementorType', 'actualProjectVendorId') },
    { title: 'Close', fields: { statusCode: { label: 'Status' }, updatedAt: { label: 'Closed at' } }, visible: row.statusCode === 'close' },
  ]
  return sections.filter((section) => section.visible).map(({ visible: _visible, ...section }) => section)
})

function image(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'object' && value !== null && typeof (value as { url?: unknown }).url === 'string') return (value as { url: string }).url
  return fileUrl(String(value))
}

function canUpdate() {
  return Array.isArray(record.value?.allowedOperations) && (record.value.allowedOperations as string[]).includes('update')
}

function filePath(value: unknown) {
  return value && typeof value === 'object' && typeof (value as { path?: unknown }).path === 'string'
    ? (value as { path: string }).path
    : value
}

async function runAction(action: string, input: Record<string, unknown> = {}) {
  if (submitting.value) return
  submitting.value = true
  try {
    const actionName = action === 'delete' ? 'deleteReport' : action === 'verify-implementation' ? 'verifyImplementation' : action === 'temporary-plan' ? 'temporaryPlan' : action === 'management-notes' ? 'managementNotes' : action === 'complete-report' ? 'completeReport' : action === 'follow-up-implementation' ? 'followUpImplementation' : action === 'follow-up-price' ? 'followUpPrice' : action === 'implementation-report' ? 'implementationReport' : action
    if (action === 'delete') await pts.actions.deleteReport.run(ptsId, String(input.deletedReason ?? ''))
    else {
      const payload = action === 'implementation-report'
        ? { ...input, imgProcess: filePath(input.imgProcess), imgAfter: filePath(input.imgAfter) }
        : input
      await (pts.actions as unknown as Record<string, { run: (id: string, value?: Record<string, unknown>) => Promise<unknown> }>)[actionName].run(ptsId, payload)
    }
    await pts.invalidate({ id: ptsId })
    await loaded.refresh()
    toast.success(`PTS ${actionLabels[action]} completed.`)
    if (action === 'delete') await router.replace({ name: 'quality-pts' })
  } catch (error) {
    toast.error(error instanceof Error ? error.message : `PTS ${actionLabels[action]} failed.`)
    throw error
  } finally {
    submitting.value = false
  }
}

async function submitAction(input: Record<string, unknown>) {
  await runAction(activeAction.value!, input)
  activeAction.value = undefined
  dialogOpen.value = false
  return input
}

async function closeAction(setOpen: (value: boolean) => void) {
  await runAction('close')
  setOpen(false)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <NavigationHeader title="Manual PTS" :back-to="{ name: 'quality-pts' }" back-label="Kembali">
      <template #controls>
        <RouterLink v-if="canUpdate()" :to="{ name: 'quality-pts-edit', params: { ptsId } }"><Button> Edit </Button></RouterLink>
      </template>
    </NavigationHeader>

    <Card v-if="loaded.loading.value" variant="outlined" color="surfaceContainer"><p role="status" aria-live="polite">Memuat…</p></Card>
    <Card v-else-if="loaded.error.value" variant="outlined" color="surfaceContainer"><p role="alert">{{ loaded.error.value.message }}</p></Card>

    <template v-else-if="record">
      <Card variant="outlined" color="surfaceContainer">
        <template #header><h2 class="font-semibold">Report images</h2></template>
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="item in [{ label: 'Before', value: record.imgBefore }, { label: 'Process', value: record.imgProcess }, { label: 'After', value: record.imgAfter }]" :key="item.label" class="flex flex-col gap-2">
            <span class="text-sm text-on-surface-variant">{{ item.label }}</span>
            <ImagePreview v-if="image(item.value)" :image-u-r-l="image(item.value)" :disable-controls="true" class="w-full" />
            <div v-else class="flex h-40 items-center justify-center rounded-xl bg-surface-container-high text-sm text-on-surface-variant">No image</div>
          </div>
        </div>
      </Card>

      <Card variant="outlined" color="surfaceContainer">
        <template #header><h2 class="font-semibold">Report summary</h2></template>
        <Detail :fields="detail.fields as never" :data="record" />
      </Card>

      <Card v-for="section in completedSections" :key="section.title" variant="outlined" color="surfaceContainer">
        <template #header><h2 class="font-semibold">{{ section.title }}</h2></template>
        <Detail :fields="section.fields as never" :data="record" />
      </Card>

      <Card variant="outlined" color="surfaceContainer">
        <template #header><h2 class="font-semibold">Workflow actions</h2></template>
        <div class="flex flex-wrap gap-2">
          <template v-for="action in availableActions" :key="action">
            <ConfirmationDialog v-if="action === 'close'" :title="'Close PTS report?'" :message="'The report will move to the close state.'" :on-confirm="closeAction">
              <template #trigger><Button :disabled="submitting">{{ actionLabels[action] }}</Button></template>
            </ConfirmationDialog>
            <Button v-else type="button" :color="action === 'delete' ? 'error' : 'primary'" :disabled="submitting" @click="activeAction = action; dialogOpen = true">{{ actionLabels[action] }}</Button>
          </template>
          <span v-if="!availableActions.length" class="text-sm text-on-surface-variant">No actions available.</span>
        </div>
      </Card>

      <Card v-if="availableActions.includes('verify-implementation')" variant="outlined" color="surfaceContainer">
        <template #header><h2 class="font-semibold">Verification required</h2></template>
        <Detail :fields="{ implementationStatusCode: { label: 'Implementation status' } } as never" :data="record" />
      </Card>

      <Card variant="outlined" color="surfaceContainer">
        <template #header><h2 class="font-semibold">History</h2></template>
        <Timeline :data="record.activity ?? []">
          <template #node><span class="size-2 rounded-full bg-primary" /></template>
          <template #header="{ data }"><span class="font-medium">{{ data.shortDescription }}</span></template>
          <template #content="{ data }"><span class="text-sm text-on-surface-variant">{{ data.createdAt }}</span></template>
        </Timeline>
      </Card>
    </template>

    <DialogForm
      v-if="activeAction && activeAction !== 'close'"
      :key="activeAction"
      :open="dialogOpen"
      @update:open="(open) => { dialogOpen = open; if (!open) activeAction = undefined }"
      :title="actionLabels[activeAction]"
      :fields="dialogFields as never"
      :initial-data="{ projectId: record?.projectId }"
      :submit="submitAction"
    />
  </div>
</template>
