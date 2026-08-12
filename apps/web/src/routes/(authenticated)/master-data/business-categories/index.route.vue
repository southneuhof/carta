<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { businessCategories } from './business-categories.resource'
</script>
<template><ListView v-bind="businessCategories.list()" title="Kategori Bisnis" /></template>
