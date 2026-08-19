<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Detail, DialogForm, NavigationHeader, useLoader, recordKey } from '@southneuhof/is-vue-framework'
import { Button, Card, Chip, Icon, ImagePreview, Timeline } from '@southneuhof/is-vue-framework/components/base'
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue'
import { fileUrl } from '@/framework/adapters/storage'
import { pts, ptsActionFields } from '../pts.resource'
import { codeLabel, dispositionLabels, jobImplementorLabels, stepLabels } from '../pts.schema'

const route = useRoute('quality-pts-detail')
const router = useRouter()
const ptsId = String(route.params.ptsId)
const detail = pts.detail({ id: ptsId })
const loaded = useLoader({
  key: recordKey({ resource: detail.namespace, id: detail.id, searchParameters: detail.searchParameters }),
  context: { id: detail.id, searchParameters: detail.searchParameters },
  load: detail.run,
})
const record = computed(() => loaded.data.value as Record<string, any> | undefined)
const activeAction = ref<string>()
const dialogOpen = ref(false)
const submitting = ref(false)

const actionLabels: Record<string, string> = {
  disposition: 'Disposition',
  'temporary-plan': 'Temporary plan',
  'management-notes': 'Management notes',
  'complete-report': 'Complete report',
  'complete-qi-report': 'Lengkapi Laporan',
  'follow-up-implementation': 'Implementation follow-up',
  'follow-up-price': 'Price follow-up',
  'implementation-report': 'Implementation report',
  'verify-implementation': 'Verify implementation',
  realization: 'Realization',
  close: 'Close',
  delete: 'Delete',
}

type ActionIcon = 'git-merge' | 'sticky-note' | 'task' | 'tools' | 'money-dollar-box' | 'image-edit' | 'shield-check' | 'checkbox-circle' | 'close-circle' | 'delete-bin' | 'arrow-right-circle'

const statusLabels: Record<string, string> = {
  open: 'Open',
  'on-progress': 'In progress',
  close: 'Closed',
}

const statusColors: Record<string, 'info' | 'warning' | 'success'> = {
  open: 'info',
  'on-progress': 'warning',
  close: 'success',
}

const actionIcons: Record<string, ActionIcon> = {
  disposition: 'git-merge',
  'temporary-plan': 'sticky-note',
  'management-notes': 'task',
  'complete-report': 'checkbox-circle',
  'complete-qi-report': 'checkbox-circle',
  'follow-up-implementation': 'tools',
  'follow-up-price': 'money-dollar-box',
  'implementation-report': 'image-edit',
  'verify-implementation': 'shield-check',
  realization: 'checkbox-circle',
  close: 'close-circle',
  delete: 'delete-bin',
}

const actionFields: Record<string, Record<string, unknown>> = {
  disposition: { dispositionStatusCode: ptsActionFields.dispositionStatusCode },
  'temporary-plan': { temporaryFollowUpPlan: ptsActionFields.temporaryFollowUpPlan },
  'management-notes': { managementNotes: ptsActionFields.managementNotes },
  'complete-report': { somUserId: ptsActionFields.somUserId, followUpPlan: ptsActionFields.followUpPlan, targetDate: ptsActionFields.targetDate },
  'complete-qi-report': {
    criteriaCode: ptsActionFields.criteriaCode,
    rootCauseIds: ptsActionFields.rootCauseIds,
    imgBefore: ptsActionFields.imgBefore,
    location: ptsActionFields.location,
    description: ptsActionFields.description,
  },
  'follow-up-implementation': { implementationUserId: ptsActionFields.implementationUserId, workMethod: ptsActionFields.workMethod },
  'follow-up-price': { estimationCost: ptsActionFields.estimationCost, jobImplementorType: ptsActionFields.jobImplementorType, projectVendorId: ptsActionFields.projectVendorId },
  'implementation-report': {
    implementationDate: ptsActionFields.implementationDate,
    imgProcess: ptsActionFields.imgProcess,
    imgAfter: ptsActionFields.imgAfter,
    implementationDescription: ptsActionFields.implementationDescription,
  },
  'verify-implementation': { implementationStatusCode: ptsActionFields.implementationStatusCode, implementationVerificationDescription: ptsActionFields.implementationVerificationDescription },
  realization: { actualCost: ptsActionFields.actualCost, actualJobImplementorType: ptsActionFields.actualJobImplementorType, actualProjectVendorId: ptsActionFields.actualProjectVendorId },
  delete: { deletedReason: { label: 'Delete reason', form: { renderer: 'textarea', props: { required: true } } } },
}

const dialogFields = computed(() => actionFields[activeAction.value ?? ''] ?? {})
const availableActions = computed(() => (Array.isArray(record.value?.availableActions) ? (record.value.availableActions as string[]) : []))
type DetailSection = { title: string; fields: Record<string, { label: string; read?: (record: Record<string, any>) => unknown }> }
const implementationStatusLabels = { waiting: 'Waiting', approved: 'Approved', rejected: 'Rejected' }

function hasValue(row: Record<string, any>, ...keys: string[]) {
  return keys.some((key) => row[key] !== undefined && row[key] !== null && row[key] !== '')
}

function value(record: Record<string, unknown> | undefined, key: string) {
  const current = record?.[key]
  return current == null || current === '' ? '—' : String(current)
}

function relation(record: Record<string, unknown> | undefined, key: string, fallbackKey: string) {
  const related = record?.[key]
  if (related && typeof related === 'object' && typeof (related as { name?: unknown }).name === 'string') return (related as { name: string }).name
  return value(record, fallbackKey)
}

function statusLabel(value: unknown) {
  return statusLabels[String(value)] ?? String(value || 'Unknown')
}

function statusColor(value: unknown) {
  return statusColors[String(value)] ?? 'info'
}

function stepLabel(value: unknown) {
  return codeLabel(value, stepLabels)
}

function actionIcon(action: string): ActionIcon {
  return actionIcons[action] ?? 'arrow-right-circle'
}

function openAction(action: string) {
  activeAction.value = action
  dialogOpen.value = true
}

const completedSections = computed<DetailSection[]>(() => {
  const row = record.value
  if (!row) return []
  const sections: Array<DetailSection & { visible: boolean }> = [
    {
      title: 'Disposition',
      fields: { dispositionStatusCode: { label: 'Disposition', read: (value) => codeLabel(value.dispositionStatusCode, dispositionLabels) } },
      visible: hasValue(row, 'dispositionStatusCode'),
    },
    { title: 'Temporary plan', fields: { temporaryFollowUpPlan: { label: 'Temporary Follow-up Plan' } }, visible: hasValue(row, 'temporaryFollowUpPlan') },
    { title: 'Management notes', fields: { managementNotes: { label: 'Management Notes' } }, visible: hasValue(row, 'managementNotes') },
    {
      title: 'Complete report',
      fields: { somUserId: { label: 'SOM User' }, followUpPlan: { label: 'Follow-up Plan' }, targetDate: { label: 'Target Date' } },
      visible: hasValue(row, 'somUserId', 'followUpPlan', 'targetDate'),
    },
    {
      title: 'Implementation follow-up',
      fields: { implementationUserId: { label: 'Implementation User' }, workMethod: { label: 'Work Method' } },
      visible: hasValue(row, 'implementationUserId', 'workMethod'),
    },
    {
      title: 'Price follow-up',
      fields: {
        estimationCost: { label: 'Estimated Cost' },
        jobImplementorType: { label: 'Job Implementor', read: (value) => codeLabel(value.jobImplementorType, jobImplementorLabels) },
        projectVendorId: { label: 'Project Vendor' },
      },
      visible: hasValue(row, 'estimationCost', 'jobImplementorType', 'projectVendorId'),
    },
    {
      title: 'Implementation report',
      fields: { implementationDate: { label: 'Implementation Date' }, implementationDescription: { label: 'Description' } },
      visible: hasValue(row, 'implementationDate', 'imgProcess', 'imgAfter', 'implementationDescription'),
    },
    {
      title: 'Verification',
      fields: {
        implementationStatusCode: { label: 'Verification', read: (value) => codeLabel(value.implementationStatusCode, implementationStatusLabels) },
        implementationVerificationDescription: { label: 'Verification Description' },
      },
      visible: hasValue(row, 'implementationStatusCode', 'implementationVerificationDescription'),
    },
    {
      title: 'Realization',
      fields: {
        actualCost: { label: 'Actual Cost' },
        actualJobImplementorType: { label: 'Actual Job Implementor', read: (value) => codeLabel(value.actualJobImplementorType, jobImplementorLabels) },
        actualProjectVendorId: { label: 'Actual Project Vendor' },
      },
      visible: hasValue(row, 'actualCost', 'actualJobImplementorType', 'actualProjectVendorId'),
    },
    { title: 'Close', fields: { statusCode: { label: 'Status', read: (value) => statusLabel(value.statusCode) }, updatedAt: { label: 'Closed at' } }, visible: row.statusCode === 'close' },
  ]
  return sections.filter((section) => section.visible).map(({ title, fields }) => ({ title, fields }))
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
  return value && typeof value === 'object' && typeof (value as { path?: unknown }).path === 'string' ? (value as { path: string }).path : value
}

async function runAction(action: string, input: Record<string, unknown> = {}) {
  if (submitting.value) return
  submitting.value = true
  try {
    const actionName =
      action === 'delete'
        ? 'deleteReport'
        : action === 'verify-implementation'
        ? 'verifyImplementation'
        : action === 'temporary-plan'
        ? 'temporaryPlan'
        : action === 'management-notes'
        ? 'managementNotes'
        : action === 'complete-report'
        ? 'completeReport'
        : action === 'complete-qi-report'
        ? 'completeQiReport'
        : action === 'follow-up-implementation'
        ? 'followUpImplementation'
        : action === 'follow-up-price'
        ? 'followUpPrice'
        : action === 'implementation-report'
        ? 'implementationReport'
        : action
    if (action === 'delete') await pts.actions.deleteReport.run(ptsId, String(input.deletedReason ?? ''))
    else {
      const payload =
        action === 'implementation-report'
          ? { ...input, imgProcess: filePath(input.imgProcess), imgAfter: filePath(input.imgAfter) }
          : action === 'complete-qi-report'
          ? {
              ...input,
              rootCauseIds: (Array.isArray(input.rootCauseIds) ? input.rootCauseIds : [])
                .map((item) => (typeof item === 'string' ? item : item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string' ? (item as { id: string }).id : ''))
                .filter(Boolean),
              imgBefore: filePath(input.imgBefore),
            }
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
  <div class="flex flex-col gap-2">
    <NavigationHeader title="PTS" :back-to="{ name: 'quality-pts' }" back-label="Kembali">
      <template #header>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-lg font-semibold leading-6 tracking-tight text-on-surface">PTS</h1>
            <Chip v-if="record" variant="tonal" :color="statusColor(record.statusCode)">{{ statusLabel(record.statusCode) }}</Chip>
          </div>
          <p class="mt-1 truncate text-sm leading-5 text-on-surface-variant">{{ value(record, 'number') }} · {{ relation(record, 'project', 'projectName') }}</p>
        </div>
      </template>
      <template #controls>
        <RouterLink v-if="canUpdate()" v-slot="{ href, navigate }" custom :to="{ name: 'quality-pts-edit', params: { ptsId } }">
          <Button type="button" variant="tonal" :href="href" @click="navigate">
            <template #icon><Icon name="edit" /></template>
            Edit report
          </Button>
        </RouterLink>
      </template>
    </NavigationHeader>

    <Card v-if="loaded.loading.value" variant="outlined" color="surfaceContainer" class="p-6"><p role="status" aria-live="polite">Memuat…</p></Card>
    <Card v-else-if="loaded.error.value" variant="outlined" color="surfaceContainer" class="p-6"
      ><p role="alert">{{ loaded.error.value.message }}</p></Card
    >

    <template v-else-if="record">
      <div class="grid items-start gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <main class="flex min-w-0 flex-col gap-2">
          <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
            <header class="flex items-center justify-between gap-2 border-b border-outline-variant px-5 py-4 sm:px-6">
              <div>
                <h2 class="font-semibold">Evidence</h2>
                <p class="mt-1 text-sm text-on-surface-variant">Before, during, and after the corrective work.</p>
              </div>
              <Icon name="image" size="2xl" class="text-primary" />
            </header>
            <div class="grid gap-px bg-outline-variant sm:grid-cols-3">
              <div
                v-for="item in [
                  { label: 'Before', value: record.imgBefore },
                  { label: 'Process', value: record.imgProcess },
                  { label: 'After', value: record.imgAfter },
                ]"
                :key="item.label"
                class="bg-surface-container-low p-3"
              >
                <div class="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <ImagePreview v-if="image(item.value)" :image-u-r-l="image(item.value)" :disable-controls="true" class="h-full w-full rounded-lg" />
                  <div v-else class="flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant">
                    <Icon name="image" size="2xl" />
                  </div>
                  <span class="pointer-events-none absolute left-3 top-3 z-10 rounded-md bg-surface/[88%] px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">{{
                    item.label
                  }}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
            <header class="flex items-center justify-between gap-2 border-b border-outline-variant px-5 py-4 sm:px-6">
              <div>
                <h2 class="font-semibold">Report overview</h2>
                <p class="mt-1 text-sm text-on-surface-variant">The finding and its original context.</p>
              </div>
              <Chip variant="tonal" :color="statusColor(record.statusCode)">{{ statusLabel(record.statusCode) }}</Chip>
            </header>
            <div class="p-5 sm:p-6">
              <Detail :fields="detail.fields as never" :data="record" />
            </div>
          </Card>

          <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
            <header class="border-b border-outline-variant px-5 py-4 sm:px-6">
              <h2 class="font-semibold">Workflow record</h2>
              <p class="mt-1 text-sm text-on-surface-variant">Completed steps and decisions for this report.</p>
            </header>
            <div v-if="completedSections.length" class="divide-y divide-outline-variant">
              <section v-for="section in completedSections" :key="section.title" class="p-5 sm:px-6">
                <h3 class="font-medium">{{ section.title }}</h3>
                <Detail class="mt-3" :fields="section.fields as never" :data="record" />
              </section>
            </div>
            <p v-else class="p-5 text-sm text-on-surface-variant sm:p-6">No workflow steps have been recorded.</p>
          </Card>

          <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
            <header class="flex items-center gap-3 border-b border-outline-variant px-5 py-4 sm:px-6">
              <Icon name="history" size="xl" class="text-primary" />
              <div>
                <h2 class="font-semibold">History</h2>
                <p class="mt-1 text-sm text-on-surface-variant">A record of changes and actions.</p>
              </div>
            </header>
            <div class="p-5 sm:p-6">
              <Timeline v-if="record.activity?.length" :data="record.activity">
                <template #node><span class="size-2 rounded-full bg-primary" /></template>
                <template #header="{ data }"
                  ><span class="font-medium">{{ data.shortDescription }}</span></template
                >
                <template #content="{ data }"
                  ><span class="text-sm text-on-surface-variant">{{ data.createdAt }}</span></template
                >
              </Timeline>
              <p v-else class="text-sm text-on-surface-variant">No history yet.</p>
            </div>
          </Card>
        </main>

        <aside class="xl:sticky xl:-top-6">
          <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
            <header class="border-b border-outline-variant px-5 py-4">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-semibold">Next actions</h2>
                <Icon name="git-merge" size="xl" class="text-primary" />
              </div>
              <p class="mt-1 text-sm text-on-surface-variant">Step: {{ stepLabel(record.stepCode) }}</p>
            </header>
            <div class="flex flex-col gap-2 p-4">
              <template v-for="action in availableActions" :key="action">
                <ConfirmationDialog v-if="action === 'close'" title="Close PTS report?" message="The report will move to the close state." :on-confirm="closeAction">
                  <template #trigger>
                    <Button type="button" variant="filled" color="success" class="w-full justify-start" :disabled="submitting">
                      <template #icon><Icon :name="actionIcon(action)" /></template>
                      {{ actionLabels[action] }}
                    </Button>
                  </template>
                </ConfirmationDialog>
                <Button
                  v-else
                  type="button"
                  :variant="action === 'delete' ? 'outlined' : 'tonal'"
                  :color="action === 'delete' ? 'error' : 'primary'"
                  class="w-full justify-start"
                  :disabled="submitting"
                  @click="openAction(action)"
                >
                  <template #icon><Icon :name="actionIcon(action)" /></template>
                  {{ actionLabels[action] }}
                </Button>
              </template>
              <p v-if="!availableActions.length" class="px-2 py-3 text-sm text-on-surface-variant">No actions available.</p>

              <div v-if="availableActions.includes('verify-implementation')" class="mt-3 border-t border-outline-variant pt-4">
                <div class="flex items-center gap-2">
                  <Icon name="shield-check" size="lg" class="text-warning" />
                  <h3 class="font-medium">Verification required</h3>
                </div>
                <Detail
                  class="mt-3"
                  :fields="{ implementationStatusCode: { label: 'Implementation status', read: (value: Record<string, any>) => codeLabel(value.implementationStatusCode, implementationStatusLabels) } } as never"
                  :data="record"
                />
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </template>

    <DialogForm
      v-if="activeAction && activeAction !== 'close'"
      :key="activeAction"
      :open="dialogOpen"
      @update:open="
        (open) => {
          dialogOpen = open
          if (!open) activeAction = undefined
        }
      "
      :title="actionLabels[activeAction]"
      :fields="dialogFields as never"
      :initial-data="{ projectId: record?.projectId }"
      :submit="submitAction"
    />
  </div>
</template>
