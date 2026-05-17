import type { ModelConfig } from '@southneuhof/is-data-model'

const mappingRoleFormTypeModel: ModelConfig = {
  name: 'mappingRoleFormType',
  title: 'Mapping Role Form Type',
  modelAPI: 'mappingRoleFormType',
  fields: ['id', 'name', 'active'],
  actions: { create: false, update: false, delete: false, detail: false },
  view: {
    list: {
      getAPI: 'mappingRoleFormType/list',
      fields: ['id', 'name', 'active'],
    },
  },
}

export default mappingRoleFormTypeModel
