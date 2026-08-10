<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { projectVendors } from '../master-data.resources'
</script>

<template><FormView title="Create Project Vendors" :resource="projectVendors" /></template>
