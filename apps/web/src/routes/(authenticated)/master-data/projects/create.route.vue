<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { projects } from './projects.resource'
</script>

<template><FormView v-bind="projects.create()" title="Create Proyek" /></template>
