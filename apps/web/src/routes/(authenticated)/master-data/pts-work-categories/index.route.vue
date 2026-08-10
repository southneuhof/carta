<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from './pts-work-categories.resource'
</script>
<template><ListView title="Kategori Pekerjaan" :resource="ptsWorkCategories" /></template>
