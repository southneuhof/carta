<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import permissionModel from '@client/data-model/models/permission.model'
</script>

<template>
  <CRUDComposite :config="permissionModel"/>
</template>
