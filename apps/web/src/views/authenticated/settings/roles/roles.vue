<script setup lang="ts">
import roles from '@client/data-model/models/roles.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
import RolesDetailUnder from './_layouts/RolesDetailUnder.vue'
import { keyManager } from '@/stores/keyManager'
</script>

<template>
  <CRUDComposite :config="roles">
    <template #detail-under="{ data }">
      <div class="flex flex-col gap-2">
        <RolesDetailUnder :key="keyManager().value['roles-detail-under']" />
      </div>
    </template>
  </CRUDComposite>
</template>
