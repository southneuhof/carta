<script setup lang="ts">
/**
 * Draft surface shell.
 *
 * Owns the Card, title, and submit/cancel chrome, wiring them through Form's
 * exposed contract. Like Form itself, it never learns whether the submission
 * creates or updates.
 */
import { computed, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { toast } from 'vue-sonner'
import type { FormProps, MaybePromise, RecordIdentity, SubmitError } from '../../contracts'
import Form from '../core/Form.vue'
import ViewControls from './ViewControls.vue'
import { controlsAt, type ViewControl } from './controls'

type FormOptions = {
  initialData?: Record<string, unknown>
  searchParameters?: Record<string, unknown>
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
type ResourceAction = { to?: RouteLocationRaw | BivariantMethod<RecordIdentity, RouteLocationRaw> }
type ResourceFormOptions = {
  afterSubmit?: BivariantMethod<FormSubmissionContext<Record<string, unknown>, RecordIdentity>, MaybePromise<void>>
  successMessage?: string | false
}

type CreateFormResource = {
  readonly __formCapabilities: 'create'
  actions: { create?: unknown; update?: never; detail?: ResourceAction; list?: ResourceAction }
  identity: BivariantMethod<Record<string, unknown>, RecordIdentity>
  form(): FormProps<Record<string, unknown>, Record<string, unknown>>
  form(args: FormOptions): FormProps<Record<string, unknown>, Record<string, unknown>>
} & ResourceFormOptions

type UpdateFormResource = {
  readonly __formCapabilities: 'update'
  actions: { create?: never; update?: unknown; detail?: ResourceAction; list?: ResourceAction }
  identity: BivariantMethod<Record<string, unknown>, RecordIdentity>
  form(args: FormOptions & { id: RecordIdentity }): FormProps<Record<string, unknown>, Record<string, unknown>>
} & ResourceFormOptions

type CreateUpdateFormResource = {
  readonly __formCapabilities: 'create-update'
  actions: { create?: unknown; update?: unknown; detail?: ResourceAction; list?: ResourceAction }
  identity: BivariantMethod<Record<string, unknown>, RecordIdentity>
  form(): FormProps<Record<string, unknown>, Record<string, unknown>>
  form(args: FormOptions): FormProps<Record<string, unknown>, Record<string, unknown>>
  form(args: FormOptions & { id: RecordIdentity }): FormProps<Record<string, unknown>, Record<string, unknown>>
} & ResourceFormOptions

export type ResourceFormViewProps<TRecord extends object, TIdentity extends RecordIdentity, TCreate extends object, TUpdate extends object = TCreate> = {
  resource: {
    identity: (record: TRecord) => TIdentity
    actions: { detail?: { to?: RouteLocationRaw | ((id: TIdentity) => RouteLocationRaw) }; list?: { to?: RouteLocationRaw } }
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
  controls?: readonly ViewControl[]
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
  const detail = props.resource?.actions.detail?.to
  if (typeof detail === 'function') return detail(props.resource!.identity(record))
  if (detail) return detail
  const list = props.resource?.actions.list?.to
  return typeof list === 'function' ? undefined : list
}

async function submitted(result: unknown) {
  if (!result || typeof result !== 'object') return
  const record = result as Record<string, unknown>
  emit('submitted', record)
  if (!props.resource) return

  const successMessage = props.resource.successMessage === undefined ? 'Data berhasil disimpan.' : props.resource.successMessage
  if (successMessage) toast.success(successMessage)
  let handled = false
  const navigate = async (to: RouteLocationRaw) => {
    handled = true
    await router.replace(to)
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
    toast.error('Data tersimpan, tetapi tindakan lanjutan gagal.')
  }
}

const instance = ref<{ submit: () => Promise<void>; reset: () => void; submitting: boolean } | null>(null)
</script>

<template>
  <section class="is-form-view">
    <header>
      <slot name="header">
        <h1 v-if="title">{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </slot>
      <slot name="controls">
        <ViewControls :controls="controlsAt(props.controls, 'primary')" label="Kontrol utama" />
      </slot>
    </header>

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
        <template #controls>
          <slot name="form-controls" :submit="() => instance?.submit()" :reset="() => instance?.reset()">
            <div class="is-form-view-controls">
              <button type="submit" :disabled="instance?.submitting">{{ submitLabel ?? 'Simpan' }}</button>
              <button type="button" @click="instance?.reset()">Batal</button>
            </div>
          </slot>
        </template>
      </Form>
    </slot>

    <footer>
      <slot name="footer">
        <ViewControls :controls="controlsAt(props.controls, 'secondary')" label="Kontrol tambahan" />
      </slot>
    </footer>
  </section>
</template>
