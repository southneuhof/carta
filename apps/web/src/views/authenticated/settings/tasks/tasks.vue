<script setup lang="ts">
import tasks from '@client/data-model/models/tasks.model'
import CRUDComposite from '@southneuhof/is-vue-framework/components/composites/CRUDComposite.vue'
</script>

<template>
  <CRUDComposite :config="tasks"/>
</template>
