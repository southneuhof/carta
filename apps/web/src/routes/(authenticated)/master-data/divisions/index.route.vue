<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { divisions } from '../master-data.resources'
</script>
<template><ListView title="Divisions" :resource="divisions" /></template>
