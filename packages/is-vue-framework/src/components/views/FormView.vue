<script setup lang="ts">
/**
 * Draft surface shell.
 *
 * Owns the Card, title, and submit/cancel chrome, wiring them through Form's
 * exposed contract. Like Form itself, it never learns whether the submission
 * creates or updates.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRouter, type RouteLocationRaw } from 'vue-router'
import { toast } from 'vue-sonner'
import type { FieldContext, FormProps, MaybePromise, RecordIdentity, SubmitError } from '../../contracts'
import Form from '../core/Form.vue'
import Button from '../base/Button.vue'
import Card from '../base/Card.vue'
import Dialog from '../base/Dialog.vue'
import NavigationHeader from './NavigationHeader.vue'

type FormOptions = {
  initialData?: Record<string, unknown>
  searchParameters?: Record<string, unknown>
  context?: FieldContext
}

export interface FormSubmissionContext<TRecord extends object, TIdentity extends RecordIdentity> {
  record: TRecord
  id: TIdentity
  operation: 'create' | 'update'
  defaultTo: RouteLocationRaw | undefined
  navigate: (to: RouteLocationRaw) => Promise<void>
  preventDefaultNavigation: () => void
}

type BivariantMethod<TArgument, TResult> = { method(argument: TArgument): TResult }['method']
type ResourceCapability = { to?: RouteLocationRaw | BivariantMethod<RecordIdentity, RouteLocationRaw> | { name: string; params: BivariantMethod<RecordIdentity, Record<string, string | number>> } }
type ResourceFormOptions = {
  afterSubmit?: BivariantMethod<FormSubmissionContext<Record<string, unknown>, RecordIdentity>, MaybePromise<void>>
  successMessage?: string | false
}

type CreateFormResource = {
  readonly __formCapabilities: 'create'
  capabilities: { create?: unknown; update?: never; detail?: ResourceCapability; list?: ResourceCapability }
  identity: BivariantMethod<Record<string, unknown>, RecordIdentity>
  form(): FormProps<Record<string, unknown>, Record<string, unknown>>
  form(args: FormOptions): FormProps<Record<string, unknown>, Record<string, unknown>>
} & ResourceFormOptions

type UpdateFormResource = {
  readonly __formCapabilities: 'update'
  capabilities: { create?: never; update?: unknown; detail?: ResourceCapability; list?: ResourceCapability }
  identity: BivariantMethod<Record<string, unknown>, RecordIdentity>
  form(args: FormOptions & { id: RecordIdentity }): FormProps<Record<string, unknown>, Record<string, unknown>>
} & ResourceFormOptions

type CreateUpdateFormResource = {
  readonly __formCapabilities: 'create-update'
  capabilities: { create?: unknown; update?: unknown; detail?: ResourceCapability; list?: ResourceCapability }
  identity: BivariantMethod<Record<string, unknown>, RecordIdentity>
  form(): FormProps<Record<string, unknown>, Record<string, unknown>>
  form(args: FormOptions): FormProps<Record<string, unknown>, Record<string, unknown>>
  form(args: FormOptions & { id: RecordIdentity }): FormProps<Record<string, unknown>, Record<string, unknown>>
} & ResourceFormOptions

export type ResourceFormViewProps<TRecord extends object, TIdentity extends RecordIdentity, TCreate extends object, TUpdate extends object = TCreate> = {
  resource: {
    identity: (record: TRecord) => TIdentity
    capabilities: { detail?: { to?: { name: string } | { name: string; params: (id: TIdentity) => Record<string, string | number> } }; list?: { to?: { name: string } } }
    form: {
      (): FormProps<TCreate, TRecord>
      (args: FormOptions): FormProps<TCreate, TRecord>
      (args: FormOptions & { id: TIdentity }): FormProps<TUpdate, TRecord>
    }
  }
  id?: TIdentity
  formOptions?: FormOptions
  afterSubmit?: (context: FormSubmissionContext<TRecord, TIdentity>) => MaybePromise<void>
  successMessage?: string | false
}

type FormViewProps = ({
  formProps: FormProps
  resource?: never
  id?: never
  formOptions?: never
  afterSubmit?: never
  successMessage?: never
} | {
  resource: CreateFormResource
  id?: never
  formOptions?: FormOptions
  formProps?: never
} | {
  resource: UpdateFormResource
  id: RecordIdentity
  formOptions?: FormOptions
  formProps?: never
} | {
  resource: CreateUpdateFormResource
  id?: RecordIdentity
  formOptions?: FormOptions
  formProps?: never
}) & {
  title?: string
  description?: string
  submitLabel?: string
}

const props = defineProps<FormViewProps>()
const router = useRouter()

const surface = computed(() => {
  if ('formProps' in props && props.formProps) return props.formProps
  const form = props.resource!.form as (args?: FormOptions & { id?: RecordIdentity }) => FormProps<Record<string, unknown>, Record<string, unknown>>
  return props.id === undefined
    ? (props.formOptions ? form(props.formOptions) : form())
    : form({ ...props.formOptions, id: props.id })
})

const emit = defineEmits<{
  (event: 'submitted', result: unknown): void
  (event: 'error', error: SubmitError): void
}>()

function defaultTarget(record: Record<string, unknown>): RouteLocationRaw | undefined {
  const detail = props.resource?.capabilities?.detail?.to
  if (typeof detail === 'function') return detail(props.resource!.identity(record))
  if (typeof detail === 'string') return detail
  if (detail && typeof detail === 'object' && 'params' in detail && typeof detail.params === 'function') return { name: detail.name, params: detail.params(props.resource!.identity(record)) } as RouteLocationRaw
  if (detail) return detail as RouteLocationRaw
  const list = props.resource?.capabilities?.list?.to
  if (typeof list === 'string') return list
  return list ? list as RouteLocationRaw : undefined
}

async function submitted(result: unknown) {
  if (!result || typeof result !== 'object') return
  const record = result as Record<string, unknown>
  emit('submitted', record)
  if (!props.resource) return

  const successMessage = props.resource.successMessage === undefined ? 'Changes saved.' : props.resource.successMessage
  if (successMessage) toast.success(successMessage)
  let handled = false
  const navigate = async (to: RouteLocationRaw) => {
    handled = true
    allowNextLeave.value = true
    try {
      const result = await router.replace(to)
      if (result) allowNextLeave.value = false
    } catch (error) {
      allowNextLeave.value = false
      throw error
    }
  }
  const context: FormSubmissionContext<Record<string, unknown>, RecordIdentity> = {
    record,
    id: props.id === undefined ? props.resource.identity(record) : props.id,
    operation: props.id === undefined ? 'create' : 'update',
    defaultTo: defaultTarget(record),
    navigate,
    preventDefaultNavigation: () => { handled = true },
  }
  try {
    await props.resource.afterSubmit?.(context)
    if (!handled && context.defaultTo) await navigate(context.defaultTo)
  } catch {
    toast.error('Changes saved, but the next action could not be completed.')
  }
}

const instance = ref<{ submit: () => Promise<void>; reset: () => void; submitting: boolean; validating: boolean; dirty: boolean } | null>(null)
const discardDialogOpen = ref(false)
const allowNextLeave = ref(false)
let resolvePendingLeave: ((allow: boolean) => void) | undefined

function settlePendingLeave(allow: boolean) {
  const resolve = resolvePendingLeave
  resolvePendingLeave = undefined
  discardDialogOpen.value = false
  resolve?.(allow)
}

onBeforeRouteLeave(() => {
  if (allowNextLeave.value) {
    allowNextLeave.value = false
    return true
  }
  if (!instance.value?.dirty) return true

  discardDialogOpen.value = true
  return new Promise<boolean>((resolve) => {
    resolvePendingLeave = resolve
  })
})

function beforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  watch(
    () => instance.value?.dirty ?? false,
    (dirty) => {
      if (dirty) window.addEventListener('beforeunload', beforeUnload)
      else window.removeEventListener('beforeunload', beforeUnload)
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
  settlePendingLeave(false)
})
</script>

<template>
  <section class="is-form-view flex flex-col gap-2">
    <NavigationHeader :title="title" :description="description">
      <template v-if="$slots.header" #header><slot name="header" /></template>
      <template v-if="$slots.controls" #controls><slot name="controls" /></template>
    </NavigationHeader>

    <Card variant="outlined" color="surfaceContainer" class="p-0">
      <div class="p-5 sm:p-6">
        <slot name="body" v-bind="{ form: surface }">
          <Form
            ref="instance"
            v-bind="surface"
            @submitted="submitted"
            @error="emit('error', $event)"
          >
            <template v-for="(_, name) in $slots" #[name]="slotProps" :key="name">
              <slot :name="name" v-bind="slotProps ?? {}" />
            </template>
            <template #actions>
              <slot name="form-actions" :submit="() => instance?.submit()" :reset="() => instance?.reset()">
                <div class="is-form-view-controls flex flex-col gap-2 border-t border-outline-variant pt-5 sm:flex-row sm:justify-end">
                  <Button type="button" variant="text" class="w-full sm:w-auto" :disabled="instance?.submitting || instance?.validating" @click="router.back()">Cancel</Button>
                  <Button type="submit" class="w-full sm:w-auto" :disabled="instance?.submitting || instance?.validating">{{ instance?.submitting ? 'Saving…' : submitLabel ?? 'Save' }}</Button>
                </div>
              </slot>
            </template>
          </Form>
        </slot>
      </div>
    </Card>

    <Dialog v-model="discardDialogOpen" @close="settlePendingLeave(false)">
      <template #trigger><button type="button" class="sr-only" aria-hidden="true" tabindex="-1">Open discard changes dialog</button></template>
      <template #title>Discard unsaved changes?</template>
      <template #description>You have unsaved changes. If you leave now, they will be lost.</template>
      <template #footer>
        <Button type="button" variant="text" @click="settlePendingLeave(false)">Stay</Button>
        <Button type="button" color="error" @click="settlePendingLeave(true)">Discard changes</Button>
      </template>
    </Dialog>

    <footer>
      <slot name="footer" />
    </footer>
  </section>
</template>
