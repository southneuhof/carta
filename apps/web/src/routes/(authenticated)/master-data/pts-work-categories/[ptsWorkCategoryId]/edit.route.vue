<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../pts-work-categories.resource'

const route = useRoute('master-data-pts-work-categories-edit')
</script>

<template><FormView title="Edit Kategori Pekerjaan" :resource="ptsWorkCategories" :id="String(route.params.ptsWorkCategoryId)" /></template>
