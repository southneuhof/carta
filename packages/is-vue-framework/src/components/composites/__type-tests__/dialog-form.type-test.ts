import type { DialogFormCloseContext, DialogFormProps } from '../../../contracts'

type Row = {
  id: string
  name: string
}

const fields = {
  id: { label: 'ID', form: { renderer: 'text' } },
  name: { label: 'Name', form: { renderer: 'text' } },
}

const submitBound = {
  fields,
  submit: async (draft: Row) => ({ id: draft.id }),
  beforeClose: async (context: DialogFormCloseContext) => !context.dirty,
} satisfies DialogFormProps<Row, { id: string }>

type ComponentProps = DialogFormProps & {
  open?: boolean
  'onUpdate:open'?: (open: boolean) => void
  'onUpdate:modelValue'?: (draft: Record<string, unknown>) => void
}
const openAndDraftBound: ComponentProps = {
  fields,
  open: true,
  'onUpdate:open': (_open: boolean) => undefined,
  modelValue: undefined,
  'onUpdate:modelValue': (_draft: Record<string, unknown>) => undefined,
}

void submitBound
void openAndDraftBound

// @ts-expect-error DialogForm requires canonical Form fields.
const missingFields: DialogFormProps<Row> = { submit: async () => undefined }
void missingFields

// @ts-expect-error Legacy model-config input is not part of DialogForm.
const legacyInputConfig: DialogFormProps<Row> = { fields, submit: async () => undefined, inputConfig: {} }
void legacyInputConfig

// @ts-expect-error Legacy field aliases are not part of DialogForm.
const legacyFieldsAlias: DialogFormProps<Row> = { fields, submit: async () => undefined, fieldsAlias: {} }
void legacyFieldsAlias
