import type { ModelConfig } from '@southneuhof/is-data-model'

const mappingPermissionRoleModel: ModelConfig = {
  name: 'mappingPermissionRole',
  title: 'Mapping Permission Role',
  modelAPI: 'mappingPermissionRole',
  fields: ['code', 'name', 'description', 'active'],
  actions: {
    create: false,
    update: false,
    delete: false,
    detail: false,
  },
  view: {
    list: {
      getAPI: 'mappingPermissionRole/list',
      fields: ['code', 'name', 'description', 'active'],
    },
  },
}

export default mappingPermissionRoleModel
