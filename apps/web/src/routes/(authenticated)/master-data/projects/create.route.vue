<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { projects } from '../master-data.resources'
</script>

<template><FormView title="Create Projects" :resource="projects" /></template>
