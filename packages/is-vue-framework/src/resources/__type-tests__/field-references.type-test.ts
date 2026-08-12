import { defineFields, defineResource, defineSchema } from '../../index'
import type { CollectionResult, ValidationResult, WebResourceCreateOf, WebResourceRecordOf, WebResourceUpdateOf } from '../../contracts'

type Row = { id: string; name: string; status: string }
type Draft = { name: string; password: string }
type Update = { name?: string; active: boolean }
const schema = defineSchema({
  identity: 'id',
  record: { schema: { validate: (value: unknown): ValidationResult<Row> => ({ success: true, data: value as Row }) } },
  query: { schema: { validate: (value: unknown): ValidationResult<Record<string, never>> => ({ success: true, data: value as Record<string, never> }) } },
  create: { schema: { validate: (value: unknown): ValidationResult<Draft> => ({ success: true, data: value as Draft }) } },
  update: { schema: { validate: (value: unknown): ValidationResult<Update> => ({ success: true, data: value as Update }) } },
})

const recordShape: WebResourceRecordOf<typeof schema> = { id: '1', name: 'One', status: 'new' }
const createShape: WebResourceCreateOf<typeof schema> = { name: 'One', password: 'secret' }
const updateShape: WebResourceUpdateOf<typeof schema> = { active: true }
const recordKey: Extract<keyof WebResourceRecordOf<typeof schema>, string> = 'name'
const createKey: Extract<keyof WebResourceCreateOf<typeof schema>, string> = 'password'
const updateKey: Extract<keyof WebResourceUpdateOf<typeof schema>, string> = 'active'
void [recordShape, createShape, updateShape, recordKey, createKey, updateKey]
const fields = defineFields(schema, {
  name: {
    label: 'Name',
    read: (record) => {
      // @ts-expect-error reads use the schema record type
      record.missing
      return record.name
    },
    write: (draft, value) => {
      // @ts-expect-error writes use the create/update draft union
      draft.missing
      draft.name = value
    },
    form: { renderer: 'text', behavior: { visible: ({ draft }) => {
      // @ts-expect-error form behavior uses the create/update draft union
      draft.missing
      return (draft.name?.length ?? 0) > 0
    } } },
  },
  password: { label: 'Password', form: { renderer: 'text' } },
  active: { label: 'Active', form: { renderer: 'switch' } },
  computed: { label: 'Computed', read: (record) => record.status, display: { renderer: 'text' } },
})

const resource = defineResource(schema, {
  key: 'rows',
  actions: {
    list: {
      run: async () => ({ data: [] } satisfies CollectionResult<Row>),
      fields: [fields.computed, fields.name],
    },
    create: { run: async (input: Draft) => ({ id: '1', name: input.name, status: 'new' }), fields: [fields.name, fields.password] },
    update: { run: async (id: string, input: Update) => ({ id, name: input.name ?? '', status: 'updated' }), fields: [fields.name, fields.active] },
  },
})

const terminal = fields.name.override({ label: 'New name', form: { props: { required: true } } })
// @ts-expect-error an override is terminal
terminal.override({ label: 'Again' })

// @ts-expect-error update-only fields are not valid create fields
defineResource(schema, { key: 'bad-create', actions: { create: { run: async (input: Draft) => ({ id: '1', name: input.name, status: 'new' }), fields: [fields.active] } } })
// @ts-expect-error computed display fields are not valid form fields
defineResource(schema, { key: 'bad-form', actions: { update: { run: async (id: string, input: Update) => ({ id, name: input.name ?? '', status: 'updated' }), fields: [fields.computed] } } })

// @ts-expect-error a definition key without a schema property must declare read
defineFields(schema, { typo: { label: 'Typo' } })

const computed = defineFields(schema, { statusLabel: { read: (record) => record.status, detail: { renderer: 'text' } } })
void [resource, computed]

const validation: ValidationResult<Row> = { success: true, data: { id: '1', name: 'One', status: 'new' } }
void validation
