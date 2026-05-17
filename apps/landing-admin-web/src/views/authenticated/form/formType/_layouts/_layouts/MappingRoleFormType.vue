<script setup lang="ts">
import { inject } from 'vue';
import { mappingRoleFormTypeModel } from '@/models';
import services from '@/utils/services';
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue';
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';

const formTypeData = inject<any>('data', {})
</script>

<template>
  <CRUDComposite
    :config="{
      ...mappingRoleFormTypeModel,
      view: {
        ...mappingRoleFormTypeModel.view,
        list: {
          ...mappingRoleFormTypeModel.view?.list,
          searchParameters: {
            form_type_id: formTypeData.id
          }
        },
      },
    }"
  >
    <template #list-rowActions="{data: roleData}">
      <Switch
        :active="roleData.active"
        :onToggle="() => {
          services.post('mappingRoleFormType/toggle', {form_type_id: formTypeData.id, role_id: roleData.id, active: !roleData.active})
        }"
      />
    </template>
  </CRUDComposite>
</template>
