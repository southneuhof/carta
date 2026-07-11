<script setup lang="ts">
import users from '@/configs/crud/users'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import UsersMappingRole from './_layouts/UsersMappingRole.vue';
</script>

<template>
  <CRUDComposite :config="users">
    <template #detail-under>
      <UsersMappingRole/>
    </template>
  </CRUDComposite>
</template>
