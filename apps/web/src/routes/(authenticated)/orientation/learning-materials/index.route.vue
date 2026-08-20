<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { learningMaterials } from './learning-materials.resource'
</script>

<template><ListView v-bind="learningMaterials.list()" title="Materi" /></template>
