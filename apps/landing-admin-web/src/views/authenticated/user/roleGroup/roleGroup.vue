<script setup lang="ts">
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue';
import roleGroupModel from '@client/data-model/models/roleGroup.model'
</script>

<template>
  <CRUDComposite :config="roleGroupModel"/>
</template>
