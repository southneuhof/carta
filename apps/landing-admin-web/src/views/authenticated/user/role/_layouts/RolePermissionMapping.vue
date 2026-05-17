<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import mappingPermissionRoleModel from '@client/data-model/models/mappingPermissionRole.model'
import services from '@/utils/services'

const props = defineProps<{ roleId: string }>()
</script>

<template>
  <CRUDComposite
    :config="{
      ...mappingPermissionRoleModel,
      view: {
        ...mappingPermissionRoleModel.view,
        list: {
          ...mappingPermissionRoleModel.view?.list,
          searchParameters: { role_id: props.roleId },
        },
      },
    }"
  >
    <template #list-rowActions="{ data: permissionData }">
      <Switch
        :active="permissionData.active"
        :onToggle="() => {
          services.post('mappingPermissionRole/toggle', { role_id: props.roleId, permission_code: permissionData.code, active: !permissionData.active })
        }"
      />
    </template>
  </CRUDComposite>
</template>
