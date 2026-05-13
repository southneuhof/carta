<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import services from '@/utils/services'
import type { ModelConfig } from '@southneuhof/is-data-model'
import { inject } from 'vue'
import { useRoute } from 'vue-router'

const user = inject<any>('data')
const route = useRoute()

function resolveUserId() {
  const id = user?.value?.id ?? user?.id ?? route.query['users_id']
  return Number(id || 0)
}

const usersMappingRoleConfig: ModelConfig = {
  name: 'mapping-role-users',
  title: 'Role',
  modelAPI: 'mapping-user-roles/list?custom',
  fields: ['role_name', 'role_code', 'description'],
  fieldsAlias: {
    role_name: 'Nama Role',
    role_code: 'Kode Role',
    description: 'Deskripsi',
  },
  actions: {
    create: false,
    delete: false,
    update: false,
    detail: false,
  },
  view: {
    list: {
      searchParameters: { user_id: resolveUserId() },
    },
  },
}
</script>

<template>
  <CRUDComposite :config="usersMappingRoleConfig">
    <template #list-rowActions="{ data }">
      <Switch
        v-model="data.active"
        :onToggle="
          (nextValue) => {
            services.post('mapping-user-roles/toggle', {
              user_id: resolveUserId(),
              role_id: data.id,
              active: nextValue,
            })
          }
        "
      />
    </template>
  </CRUDComposite>
</template>
