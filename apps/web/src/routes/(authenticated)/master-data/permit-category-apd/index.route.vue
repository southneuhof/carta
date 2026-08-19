<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { permitCategoryApds } from './permit-category-apd.resource'
</script>

<template><ListView v-bind="permitCategoryApds.list()" title="Kategori APD" /></template>
