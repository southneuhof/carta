<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { rootCauses } from '../master-data.resources'
</script>
<template><ListView title="Root Causes" :resource="rootCauses" /></template>
