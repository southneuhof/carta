import type { ModelConfig } from '@southneuhof/is-data-model'

const mappingRoleMenuItemModel: ModelConfig = {
  name: 'mappingRoleMenuItem',
  title: 'Mapping Role Menu Item',
  modelAPI: 'mappingRoleMenuItem',
  fields: ['name', 'active'],
  actions: { create: false, update: false, delete: false, detail: false },
  view: {
    list: {
      fields: ['name', 'active'],
    },
  },
}

export default mappingRoleMenuItemModel
