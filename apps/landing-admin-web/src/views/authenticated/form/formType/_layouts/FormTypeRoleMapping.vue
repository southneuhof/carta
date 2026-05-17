<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import mappingRoleFormTypeModel from '@client/data-model/models/mappingRoleFormType.model'
import services from '@/utils/services'

const props = defineProps<{ formTypeId: string }>()
</script>

<template>
  <CRUDComposite
    :config="{
      ...mappingRoleFormTypeModel,
      view: {
        ...mappingRoleFormTypeModel.view,
        list: {
          ...mappingRoleFormTypeModel.view?.list,
          searchParameters: { form_type_id: props.formTypeId },
        },
      },
    }"
  >
    <template #list-rowActions="{ data: roleData }">
      <Switch
        :active="roleData.active"
        :onToggle="() => {
          services.post('mappingRoleFormType/toggle', { form_type_id: props.formTypeId, role_id: roleData.id, active: !roleData.active })
        }"
      />
    </template>
  </CRUDComposite>
</template>
