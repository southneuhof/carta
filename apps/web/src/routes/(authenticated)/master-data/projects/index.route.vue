<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { projects } from '../master-data.resources'
</script>
<template><ListView title="Projects" :resource="projects" /></template>
