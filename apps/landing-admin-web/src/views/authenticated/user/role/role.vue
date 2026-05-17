<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import mappingPermissionRoleModel from '@client/data-model/models/mappingPermissionRole.model'
import roleModel from '@client/data-model/models/role.model'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue';
import services from '@/utils/services';

</script>

<template>
  <CRUDComposite :config="roleModel">
    <template #detail-under="{data: roleData}">
      <CRUDComposite
        :config="{
          ...mappingPermissionRoleModel,
          view: {
            ...mappingPermissionRoleModel.view,
            list: {
              ...mappingPermissionRoleModel.view?.list,
              searchParameters: {
                role_id: roleData.id
              }
            },
          },
        }"
      >
        <template #list-rowActions="{data: permissionData}">
          <Switch
            v-model="permissionData.active"
            :onToggle="(active) => {
              services.post('mappingPermissionRole/toggle', {role_id: roleData.id, permission_code: permissionData.code, active})
            }"
          />
        </template>
      </CRUDComposite>
    </template>
  </CRUDComposite>
</template>
