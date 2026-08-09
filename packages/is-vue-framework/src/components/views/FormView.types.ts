import type { FieldContext, FormProps, MaybePromise, RecordIdentity } from '../../contracts'
import type { RouteLocationRaw } from 'vue-router'

export interface FormSubmissionContext<TRecord extends object, TIdentity extends RecordIdentity> {
  record: TRecord
  id: TIdentity
  operation: 'create' | 'update'
  defaultTo: RouteLocationRaw | undefined
  navigate: (to: RouteLocationRaw) => Promise<void>
  preventDefaultNavigation: () => void
}

type FormOptions<TInput extends object = Record<string, unknown>> = {
  initialData?: Partial<TInput>
  searchParameters?: Record<string, unknown>
  context?: FieldContext
}

type FormCapabilityMode = 'create' | 'update' | 'create-update'

export type FormResourceConstraint = {
  readonly __formCapabilities: FormCapabilityMode
  capabilities: object
  identity: (...arguments_: never[]) => unknown
  form: (...arguments_: never[]) => unknown
}

export type ResourceFormViewProps<
  TRecord extends object,
  TIdentity extends RecordIdentity,
  TCreate extends object,
  TUpdate extends object = TCreate,
> = {
  resource: {
    identity: (record: TRecord) => TIdentity
    capabilities: { detail?: { to?: { name: string } | { name: string; params: (id: TIdentity) => Record<string, string | number> } }; list?: { to?: { name: string } } }
    form: {
      (): FormProps<TCreate, TRecord>
      (args: FormOptions<TCreate>): FormProps<TCreate, TRecord>
      (args: FormOptions<TUpdate> & { id: TIdentity }): FormProps<TUpdate, TRecord>
    }
  }
  id?: TIdentity
  formOptions?: FormOptions<TCreate>
  afterSubmit?: (context: FormSubmissionContext<TRecord, TIdentity>) => MaybePromise<void>
  successMessage?: string | false
}
