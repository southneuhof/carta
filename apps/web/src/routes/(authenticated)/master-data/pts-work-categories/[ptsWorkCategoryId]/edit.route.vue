<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../../master-data.resources'

const route = useRoute('master-data-pts-work-categories-edit')
</script>

<template><FormView title="Edit PTS Work Categories" :resource="ptsWorkCategories" :id="String(route.params.ptsWorkCategoryId)" /></template>
