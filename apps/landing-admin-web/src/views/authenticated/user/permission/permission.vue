<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import { permissionModel } from '@/models';
</script>

<template>
  <CRUDComposite :config="permissionModel"/>
</template>
