<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { businessCategories } from './business-categories.resource'
</script>

<template><FormView v-bind="businessCategories.create()" title="Create Kategori Bisnis" /></template>
