<script setup lang="ts">
import roles from './roles.config'
import RolesDetailUnder from './RolesDetailUnder.vue'
import { keyManager } from '@/stores/keyManager'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'

definePage({ name: 'roles', meta: { title: 'Roles', moduleName: 'settings' } })
</script>

<template>
  <CRUDComposite :config="roles">
    <template #detail-under>
      <div class="flex flex-col gap-2">
        <RolesDetailUnder :key="keyManager().value['roles-detail-under']" />
      </div>
    </template>
  </CRUDComposite>
</template>
