<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from './pts-work-categories.resource'
</script>

<template><FormView v-bind="ptsWorkCategories.create()" title="Create Kategori Pekerjaan" /></template>
