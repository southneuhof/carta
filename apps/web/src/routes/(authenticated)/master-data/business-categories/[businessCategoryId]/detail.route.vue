<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../business-categories.resource'

const route = useRoute('master-data-business-categories-detail')
</script>

<template><DetailView v-bind="businessCategories.detail({ id: String(route.params.businessCategoryId) })" title="Kategori Bisnis" :back-to="{ name: 'master-data-business-categories' }" /></template>
