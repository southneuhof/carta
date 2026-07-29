/**
 * Compile-time tests for the field catalog. Type-checked by the framework
 * `type-check`; excluded from vitest by filename.
 */
import { defineFields } from '../../fields'
import { resolveFields } from '../../fields'
import type { FieldDefinition } from '../index'
import type { FrameworkFieldDefaultsInput } from '../../fields'

interface Incident {
  incident_name: string
  rel_section_id: string
  is_accident: boolean
}

interface IncidentDraft {
  incident_name: string
  section_id: string
  is_accident: boolean
}

const incidentFields = defineFields<Incident, IncidentDraft>()({
  incident_name: {
    label: 'Nama Insiden',
    table: { sortable: true },
    form: { renderer: 'text' },
  },
  section_id: {
    label: 'Ruas',
    read: (record) => record.rel_section_id,
    write: (draft, value) => {
      draft.section_id = value as string
    },
  },
  secret: {
    table: false,
    detail: false,
  },
})

/* Catalog keys stay literal. */
type IncidentFieldKey = keyof typeof incidentFields
const knownKey: IncidentFieldKey = 'incident_name'
void knownKey
// @ts-expect-error unknown catalog key
const unknownKey: IncidentFieldKey = 'not_a_field'
void unknownKey

/* `read` sees the record type, `write` sees the draft type. */
const readsRecord: FieldDefinition<Incident, IncidentDraft>['read'] = (record) => record.rel_section_id
void readsRecord
defineFields<Incident, IncidentDraft>()({
  section_id: {
    // @ts-expect-error the record has no `section_id` property
    read: (record) => record.section_id,
  },
})

/* Projections may be excluded with `false`, but not with an arbitrary value. */
defineFields<Incident>()({
  secret: { table: false },
})
defineFields<Incident>()({
  // @ts-expect-error a projection is either config or false
  secret: { table: 'hidden' },
})

/* Widget selection is `renderer` on every surface. */
defineFields<Incident>()({
  incident_name: { table: { renderer: 'chip' }, detail: { renderer: 'chip' }, form: { renderer: 'text' } },
})
defineFields<Incident>()({
  // @ts-expect-error `type` is not a field-config key
  incident_name: { form: { type: 'text' } },
})

defineFields<Incident>()({
  incident_name: { form: { renderer: 'lookup', source: { resource: 'sections' } } },
})
defineFields<Incident>()({
  // @ts-expect-error source is only authored for form projections
  incident_name: { table: { source: { resource: 'sections' } } },
})

/* Behavior lives on the form projection only and accepts functions only. */
defineFields<Incident, IncidentDraft>()({
  incident_name: { form: { behavior: { visible: ({ draft }) => draft.is_accident } } },
})
defineFields<Incident, IncidentDraft>()({
  // @ts-expect-error behavior is a form concept; table carries none
  incident_name: { table: { behavior: { visible: () => true } } },
})
defineFields<Incident, IncidentDraft>()({
  // @ts-expect-error constants belong in the static projection
  incident_name: { form: { behavior: { visible: true } } },
})

/* Resolution returns ordered surface fields. */
const tableFields = resolveFields({ fields: incidentFields, surface: 'table', keys: ['incident_name'] })
const firstLabel: string = tableFields[0].label
void firstLabel

const keyedDefaults: FrameworkFieldDefaultsInput = { fields: { incident_name: { form: { source: { resource: 'x' }, props: { required: true } } } } }
void keyedDefaults
const surfaceDefaults: FrameworkFieldDefaultsInput = { shared: { renderer: 'text' } }
void surfaceDefaults
// @ts-expect-error uniform renderer props belong in inputProps, not fieldDefaults
const invalidSurfaceDefaults: FrameworkFieldDefaultsInput = { form: { props: { dense: true } } }
void invalidSurfaceDefaults
