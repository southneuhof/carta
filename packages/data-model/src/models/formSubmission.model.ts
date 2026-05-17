import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const formSubmissionModel: ModelConfig = withModelDefaults({
  name: 'formSubmission',
  title: 'Inbox Form',
  modelAPI: 'formSubmission',
  fields: ['form_type_id', 'formType', 'data', 'read', 'submitted_at'],
  fieldsAlias: {
    form_type_id: 'Form Type',
    read: 'Read',
    submitted_at: 'Submitted At',
  },
  actions: {
    create: false,
    delete: true,
  },
  view: {
    list: {
      filter: {
        fields: ['form_type_id', 'read'],
      },
    },
  },
  transaction: {
    fields: ['read'],
    inputConfig: {
      read: { type: 'checkbox' },
    },
  },
})

export default formSubmissionModel
