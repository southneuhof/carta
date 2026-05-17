import type { ModelConfig } from '@southneuhof/is-data-model'

const mappingRoleArticleCategoryModel: ModelConfig = {
  name: 'mappingRoleArticleCategory',
  title: 'Mapping Role Article Category',
  modelAPI: 'mappingRoleArticleCategory',
  fields: ['id', 'name', 'active'],
  actions: { create: false, update: false, delete: false, detail: false },
  view: {
    list: {
      getAPI: 'mappingRoleArticleCategory/list',
      fields: ['id', 'name', 'active'],
    },
  },
}

export default mappingRoleArticleCategoryModel
