<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import mappingRoleMenuItemModel from '@client/data-model/models/mappingRoleMenuItem.model'
import { inject } from 'vue';
import services from '@/utils/services';
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue';
import { permissions } from '@/stores/permissions';

const menuItem = inject<any>('menuItem')
</script>

<template>
  <CRUDComposite
    :permissions="{
      view: true,
      lookup: true,
      detail: true,
      create: true,
      update: true,
      delete: true
    }"
    :config="{
      ...mappingRoleMenuItemModel,
      view: {
        ...mappingRoleMenuItemModel.view,
        list: {
          ...mappingRoleMenuItemModel.view?.list,
          searchParameters: {
            menu_item_id: menuItem.id
          }
        },
      },
    }"
  >
    <template #list-rowActions="{data: roleData}">
      <Switch
        v-if="permissions().has('toggle-mappingRoleMenuItem')"
        :active="roleData.active"
        :onToggle="() => {
          services.post('mappingRoleMenuItem/toggle', {menu_item_id: menuItem.id, role_id: roleData.id, active: !roleData.active})
        }"
      />
    </template>
  </CRUDComposite>
</template>
