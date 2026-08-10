<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { projects } from '../../master-data.resources'

const route = useRoute('master-data-projects-detail')
</script>

<template><DetailView title="Projects" :back-to="{ name: 'master-data-projects' }" :resource="projects" :id="String(route.params.projectId)" /></template>
