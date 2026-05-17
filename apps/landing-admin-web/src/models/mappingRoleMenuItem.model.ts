import type { ModelConfig } from '@southneuhof/is-data-model'

const mappingRoleMenuItemModel: ModelConfig = {
  name: 'mappingRoleMenuItem',
  title: 'Mapping Role Menu Item',
  modelAPI: 'mappingRoleMenuItem',
  fields: ['id', 'name', 'active'],
  actions: { create: false, update: false, delete: false, detail: false },
  view: {
    list: {
      getAPI: 'mappingRoleMenuItem/list',
      fields: ['id', 'name', 'active'],
    },
  },
}

export default mappingRoleMenuItemModel
