<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../../master-data.resources'

const route = useRoute('master-data-business-categories-edit')
</script>

<template><FormView title="Edit Business Categories" :resource="businessCategories" :id="String(route.params.businessCategoryId)" /></template>
