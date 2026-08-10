<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { projects } from './projects.resource'
</script>
<template><ListView title="Proyek" :resource="projects" /></template>
