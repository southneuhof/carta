<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { syllabusCategories } from './syllabus-categories.resource'
</script>

<template><ListView v-bind="syllabusCategories.list()" title="Kategori Silabus" /></template>
