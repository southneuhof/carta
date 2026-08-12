<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../pts-work-categories.resource'

const route = useRoute('master-data-pts-work-categories-edit')
</script>

<template><FormView v-bind="ptsWorkCategories.update({ id: String(route.params.ptsWorkCategoryId) })" title="Edit Kategori Pekerjaan" /></template>
