import type { FieldCatalog } from '@southneuhof/is-vue-framework'

export const inputCatalogKeys = [
  'text', 'textarea', 'color', 'password', 'file', 'image', 'select', 'radio',
  'date', 'daterange', 'month', 'year', 'tag', 'currency', 'switch', 'checkbox',
  'lookup', 'location', 'multi-location', 'rich-text',
  'icon-select', 'table', 'time', 'number', 'checkbox-group',
  'separator', 'canvas', 'iso-clause',
] as const

export type InputCatalogKey = (typeof inputCatalogKeys)[number]
export type InputCatalogDraft = Record<InputCatalogKey, unknown>

const options = [
  { id: 'one', name: 'Option one' },
  { id: 'two', name: 'Option two' },
]
const localLocationOperations = {
  autocomplete: async () => [],
  detail: async ({ id }: { id: string }) => ({ lat: -6.2, lng: 106.8, formatted_address: id }),
  mapConfig: async () => ({ apiKey: '' }),
}
const localList = async () => ({ data: options, meta: { total: options.length, totalPage: 1 } })
const localDetail = async ({ id }: { id?: string | number | Readonly<Record<string, string | number>> }) => options.find((item) => item.id === id)

const fixtureProps: Partial<Record<InputCatalogKey, Record<string, unknown>>> = {
  select: { data: options, pick: 'id', view: 'name' },
  radio: { data: options, pick: 'id', view: 'name' },
  'checkbox-group': { data: options, pick: 'id', view: 'name' },
  lookup: {
    fields: {
      name: { label: 'Name' },
    },
    load: localList,
    loadDetail: localDetail,
    pick: 'id',
    view: 'name',
  },
  location: { operations: localLocationOperations },
  'multi-location': { operations: localLocationOperations },
  table: { form: {}, table: {}, fields: [] },
  canvas: { width: 320, height: 160, onSave: async (image: string) => image },
  currency: { currency: 'IDR', locale: 'id-ID' },
  tag: { placeholder: 'Add tag' },
  daterange: { locale: 'id-ID' },
}

const labels: Partial<Record<InputCatalogKey, string>> = {
  daterange: 'Date range',
  'multi-location': 'Multiple locations',
  'rich-text': 'Rich text',
  'icon-select': 'Icon select',
  'checkbox-group': 'Checkbox group',
  'iso-clause': 'ISO clause',
}

export const inputCatalogFields = Object.fromEntries(inputCatalogKeys.map((key) => [
  key,
  {
    label: labels[key] ?? key.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    form: {
      renderer: key,
      props: fixtureProps[key],
      span: ['separator', 'table', 'canvas', 'rich-text'].includes(key) ? 12 : 6,
    },
  },
])) as FieldCatalog<InputCatalogDraft, InputCatalogDraft>

export const inputCatalogInitialData: Partial<InputCatalogDraft> = {
  text: 'Editable catalog value',
  textarea: 'Longer sample text',
  color: '#2563eb',
  select: 'one',
  radio: 'two',
  date: '2026-07-29',
  daterange: ['2026-07-28', '2026-07-29'],
  month: '2026-07',
  year: 2026,
  tag: ['framework', 'demo'],
  currency: 125000,
  switch: true,
  checkbox: true,
  time: '09:30',
  number: 60,
  'checkbox-group': ['one'],
  'multi-location': [],
  table: [],
}

export function serializeCatalogValue(value: unknown): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(value, (_key, entry) => {
    if (entry instanceof Date) return entry.toISOString()
    if (typeof File !== 'undefined' && entry instanceof File) return { name: entry.name, type: entry.type, size: entry.size }
    if (typeof Blob !== 'undefined' && entry instanceof Blob) return { type: entry.type, size: entry.size }
    if (entry instanceof Map) return Object.fromEntries(entry)
    if (typeof entry === 'object' && entry !== null) {
      if (seen.has(entry)) return '[Circular]'
      seen.add(entry)
    }
    return entry
  }, 2)
}
