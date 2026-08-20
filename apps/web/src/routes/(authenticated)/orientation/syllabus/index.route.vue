<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { syllabi } from './syllabus.resource'
</script>

<template><ListView v-bind="syllabi.list()" title="Silabus" /></template>
