<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../master-data.resources'
</script>
<template><ListView title="Project Vendors" :resource="projectVendors" /></template>
