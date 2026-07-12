<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import Switch from '@southneuhof/is-vue-framework/components/inputs/Switch.vue'
import services from '@/utils/services'
import { defineCRUDCompositeConfig, type CRUDOperations } from '@southneuhof/is-vue-framework/adapters/crud-operations'
import { inject } from 'vue'
import { useRoute } from 'vue-router'

const user = inject<any>('data')
const route = useRoute()

function resolveUserId() {
  const id = user?.value?.id ?? user?.id ?? route.query['users_id']
  return Number(id || 0)
}

const unavailable = async () => { throw new Error('User-role mapping is unavailable because the current RPC does not expose this resource.') }
const unavailableOperations: CRUDOperations = { list: unavailable, detail: unavailable, create: unavailable, update: unavailable, delete: unavailable }

const usersMappingRoleConfig = defineCRUDCompositeConfig({
  name: 'mapping-role-users',
  title: 'Role',
  resource: null,
  operations: unavailableOperations,
  fields: ['role_name', 'role_code', 'description'],
  fieldsAlias: { role_name: 'Nama Role', role_code: 'Kode Role', description: 'Deskripsi' },
  actions: { create: false, delete: false, update: false, detail: false },
  view: { list: { searchParameters: { user_id: resolveUserId() } } },
})
</script>

<template>
  <CRUDComposite :config="usersMappingRoleConfig">
    <template #list-rowActions="{ data }">
      <Switch
        v-model="data.active"
        :onToggle="(nextValue) => services.post('mapping-user-roles/toggle', { user_id: resolveUserId(), role_id: data.id, active: nextValue })"
      />
    </template>
  </CRUDComposite>
</template>
