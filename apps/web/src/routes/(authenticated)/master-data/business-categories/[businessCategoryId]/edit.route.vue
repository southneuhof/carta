<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../business-categories.resource'

const route = useRoute('master-data-business-categories-edit')
</script>

<template><FormView title="Edit Kategori Bisnis" :resource="businessCategories" :id="String(route.params.businessCategoryId)" /></template>
