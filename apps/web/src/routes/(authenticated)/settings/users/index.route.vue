<script setup lang="ts">
import users from './users.config'
import UsersMappingRole from './UsersMappingRole.vue'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'

definePage({ name: 'users', meta: { title: 'Users', moduleName: 'settings' } })
</script>

<template>
  <CRUDComposite :config="users">
    <template #detail-under>
      <UsersMappingRole />
    </template>
  </CRUDComposite>
</template>
