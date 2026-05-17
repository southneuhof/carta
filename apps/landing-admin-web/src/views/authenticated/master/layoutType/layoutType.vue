<script setup lang="ts">
import layoutTypeModel from '@client/data-model/models/layoutType.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
</script>

<template>
  <CRUDComposite :config="layoutTypeModel" />
</template>
