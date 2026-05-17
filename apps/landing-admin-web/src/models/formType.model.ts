import type { ModelConfig } from '@southneuhof/is-data-model'
import { withModelDefaults } from './_defaults'

const formTypeModel: ModelConfig = withModelDefaults({
  name: 'formType',
  title: 'Jenis Formulir',
  modelAPI: 'formType',
  fields: ['id', 'name', 'description', 'allowedRoles'],
  fieldsAlias: {
    allowedRoles: 'Allowed Roles',
  },
  view: {
    detail: {
      fields: ['id', 'name', 'description', 'allowedRoles'],
    },
  },
  transaction: {
    fields: ['name', 'description'],
    inputConfig: {
      name: { type: 'text', props: { required: true } },
      description: { type: 'textarea' },
    },
  },
})

export default formTypeModel
