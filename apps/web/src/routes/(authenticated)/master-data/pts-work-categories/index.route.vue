<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { ptsWorkCategories } from '../master-data.resources'
</script>
<template><ListView title="PTS Work Categories" :resource="ptsWorkCategories" /></template>
