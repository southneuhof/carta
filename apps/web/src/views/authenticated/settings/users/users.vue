<script setup lang="ts">
import users from '@client/data-model/models/users.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import UsersMappingRole from './_layouts/UsersMappingRole.vue';
import Button from '@southneuhof/is-vue-framework/components/base/Button.vue';
</script>

<template>
  <CRUDComposite :config="users">
    <template #detail-under>
      <UsersMappingRole/>
    </template>
  </CRUDComposite>
</template>
