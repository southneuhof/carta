<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../../master-data.resources'

const route = useRoute('master-data-business-categories-detail')
</script>

<template><DetailView title="Business Categories" :back-to="{ name: 'master-data-business-categories' }" :resource="businessCategories" :id="String(route.params.businessCategoryId)" /></template>
