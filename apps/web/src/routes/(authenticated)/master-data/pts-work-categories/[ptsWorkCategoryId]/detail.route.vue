<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../pts-work-categories.resource'

const route = useRoute('master-data-pts-work-categories-detail')
</script>

<template><DetailView title="Kategori Pekerjaan" :back-to="{ name: 'master-data-pts-work-categories' }" :resource="ptsWorkCategories" :id="String(route.params.ptsWorkCategoryId)" /></template>
