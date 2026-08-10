<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { projects } from '../../master-data.resources'

const route = useRoute('master-data-projects-edit')
</script>

<template><FormView title="Edit Projects" :resource="projects" :id="String(route.params.projectId)" /></template>
