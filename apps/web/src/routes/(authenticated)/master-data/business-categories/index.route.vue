<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { businessCategories } from '../master-data.resources'
</script>
<template><ListView title="Business Categories" :resource="businessCategories" /></template>
