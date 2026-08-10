<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { businessCategories } from './business-categories.resource'
</script>
<template><ListView title="Kategori Bisnis" :resource="businessCategories" /></template>
