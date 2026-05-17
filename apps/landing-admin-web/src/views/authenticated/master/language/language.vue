<script setup lang="ts">
import languageModel from '@client/data-model/models/language.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
</script>

<template>
  <div>
    <CRUDComposite :config="languageModel" />
  </div>
</template>
