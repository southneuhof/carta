import FormView from '../FormView.vue'
import type { FormProps } from '../../../contracts'

const fields = { name: { label: 'Name' } }
type RecordResult = Record<string, unknown>
type ResultFormProps = FormProps<Record<string, unknown>, RecordResult>
const createOnly = { __formCapabilities: 'create' as const, capabilities: { create: {} }, identity: () => '1', form: (() => ({ fields, submit: async () => ({ id: '1' }) })) as { (): ResultFormProps; (args: { initialData?: { name?: string }; searchParameters?: Record<string, unknown> }): ResultFormProps } }
const updateOnly = { __formCapabilities: 'update' as const, capabilities: { update: {} }, identity: () => '1', form: (_args: { id: string; initialData?: { name?: string }; searchParameters?: Record<string, unknown> }) => ({ fields, submit: async () => ({ id: '1' }) }) }
const both = { __formCapabilities: 'create-update' as const, capabilities: { create: {}, update: {} }, identity: () => '1', form: (() => ({ fields, submit: async () => ({ id: '1' }) })) as typeof createOnly.form & typeof updateOnly.form }
type TypedRecord = { id: string; name: string }
type TypedCreate = { name: string }
const typedResource = {
  __formCapabilities: 'create' as const,
  capabilities: { create: {} },
  identity: (record: TypedRecord) => record.id,
  form: () => ({ fields, submit: async (draft: TypedCreate) => ({ id: '1', name: draft.name }) } satisfies FormProps<TypedCreate, TypedRecord>),
}

FormView({ resource: createOnly })
FormView({ resource: updateOnly, id: '1' })
FormView({ resource: both })
FormView({ resource: both, id: '1' })
FormView({ resource: typedResource })
FormView({ formProps: { fields, submit: async () => undefined } })

// @ts-expect-error update-only resources require an identity.
FormView({ resource: updateOnly })
// @ts-expect-error create-only resources cannot mount with an identity.
FormView({ resource: createOnly, id: '1' })
// @ts-expect-error FormView no longer accepts the old raw prop name.
FormView({ form: { fields, submit: async () => undefined } })
