<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import { roleGroupModel } from '@/models';
</script>

<template>
  <CRUDComposite :config="roleGroupModel"/>
</template>
