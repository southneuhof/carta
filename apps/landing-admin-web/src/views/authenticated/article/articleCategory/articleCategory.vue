<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import TranslationEditor from '@/features/translations/TranslationEditor.vue';
import articleCategoryModel from '@client/data-model/models/articleCategory.model'
import mappingRoleArticleCategoryModel from '@client/data-model/models/mappingRoleArticleCategory.model'
import services from '@/utils/services';
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue';
import { permissions } from '@/stores/permissions';
</script>

<template>
  <CRUDComposite :config="articleCategoryModel">
    <template #list-name="{data}">
      <p>{{ data.translations.find((item: any) => item.language == 'id')?.name }}</p>
    </template>
    <template #list-rowAdditionalActions="{data}">
      <Modal v-if="permissions().has('update-articleCategory')">
        <template #trigger>
          <Button variant="tonal" color="warning"><Icon>edit</Icon></Button>
        </template>
        <template #content>
          <TranslationEditor
            :data="data"
            identifier="article_category_id"
            :fields="['name']"
            targetAPI="articleCategoryTranslation"
          />
        </template>
      </Modal>
      <Modal v-if="permissions().has('list-mappingRoleArticleCategory')">
        <template #trigger>
          <Button variant="tonal" color="info"><Icon>info</Icon></Button>
        </template>
        <template #content>
          <CRUDComposite
            :config="{
              ...mappingRoleArticleCategoryModel,
              view: {
                ...mappingRoleArticleCategoryModel.view,
                list: {
                  ...mappingRoleArticleCategoryModel.view?.list,
                  searchParameters: {
                    article_category_id: data.id
                  }
                },
              },
            }"
            :permissions="{
              view: true,
              lookup: true,
              detail: true,
              create: true,
              update: true,
              delete: true
            }"
          >
            <template #list-rowActions="{data: roleData}">
              <Switch
                v-if="permissions().has('toggle-mappingRoleArticleCategory')"
                :active="roleData.active"
                :onToggle="() => {
                  services.post('mappingRoleArticleCategory/toggle', {article_category_id: data.id, role_id: roleData.id, active: !roleData.active})
                }"
              />
            </template>
          </CRUDComposite>
        </template>
      </Modal>
    </template>
  </CRUDComposite>
</template>
