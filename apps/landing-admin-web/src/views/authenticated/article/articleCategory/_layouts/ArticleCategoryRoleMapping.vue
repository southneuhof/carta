<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import { mappingRoleArticleCategoryModel } from '@/models'
import services from '@/utils/services'
import { permissions } from '@/stores/permissions'

const props = defineProps<{ articleCategoryId: string }>()
</script>

<template>
  <CRUDComposite
    :config="{
      ...mappingRoleArticleCategoryModel,
      view: {
        ...mappingRoleArticleCategoryModel.view,
        list: {
          ...mappingRoleArticleCategoryModel.view?.list,
          searchParameters: { article_category_id: props.articleCategoryId },
        },
      },
    }"
    :permissions="{ view: true, lookup: true, detail: true, create: true, update: true, delete: true }"
  >
    <template #list-rowActions="{ data: roleData }">
      <Switch
        v-if="permissions().has('toggle-mappingRoleArticleCategory')"
        :active="roleData.active"
        :onToggle="() => {
          services.post('mappingRoleArticleCategory/toggle', { article_category_id: props.articleCategoryId, role_id: roleData.id, active: !roleData.active })
        }"
      />
    </template>
  </CRUDComposite>
</template>
