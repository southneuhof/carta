<script setup lang="ts">
import { languageModel } from '@/models'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
</script>

<template>
  <div>
    <CRUDComposite :config="languageModel" />
  </div>
</template>
