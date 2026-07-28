import FormView from '../FormView.vue'
import type { FormProps } from '../../../contracts'

const fields = { name: { label: 'Name' } }
type Props = InstanceType<typeof FormView>['$props']
type RecordResult = Record<string, unknown>
type ResultFormProps = FormProps<Record<string, unknown>, RecordResult>
const createOnly = { __formCapabilities: 'create' as const, capabilities: { create: {} }, identity: () => '1', form: (() => ({ fields, submit: async () => ({ id: '1' }) })) as { (): ResultFormProps; (args: { initialData?: { name?: string }; searchParameters?: Record<string, unknown> }): ResultFormProps } }
const updateOnly = { __formCapabilities: 'update' as const, capabilities: { update: {} }, identity: () => '1', form: (_args: { id: string; initialData?: { name?: string }; searchParameters?: Record<string, unknown> }) => ({ fields, submit: async () => ({ id: '1' }) }) }
const both = { __formCapabilities: 'create-update' as const, capabilities: { create: {}, update: {} }, identity: () => '1', form: (() => ({ fields, submit: async () => ({ id: '1' }) })) as typeof createOnly.form & typeof updateOnly.form }

const create: Props = { resource: createOnly }
const update: Props = { resource: updateOnly, id: '1' }
const createOrUpdate: Props = { resource: both }
const updateBoth: Props = { resource: both, id: '1' }
const raw: Props = { formProps: { fields, submit: async () => undefined } }
void create
void update
void createOrUpdate
void updateBoth
void raw

// @ts-expect-error update-only resources require an identity.
const missingIdentity: Props = { resource: updateOnly }
void missingIdentity
// @ts-expect-error create-only resources cannot mount with an identity.
const createWithIdentity: Props = { resource: createOnly, id: '1' }
void createWithIdentity
// @ts-expect-error FormView no longer accepts the old raw prop name.
const oldProp: Props = { form: { fields, submit: async () => undefined } }
void oldProp
