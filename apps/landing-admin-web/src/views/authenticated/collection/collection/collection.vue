<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import { collectionModel } from '@/models';
</script>

<template>
  <div class="flex flex-col gap-4">
    <CRUDComposite :config="collectionModel" />
  </div>
</template>
