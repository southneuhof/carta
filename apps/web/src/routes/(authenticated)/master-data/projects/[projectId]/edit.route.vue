<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { projects } from '../projects.resource'

const route = useRoute('master-data-projects-edit')
</script>

<template><FormView v-bind="projects.update({ id: String(route.params.projectId) })" title="Edit Proyek" /></template>
