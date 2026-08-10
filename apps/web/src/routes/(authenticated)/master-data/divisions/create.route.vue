<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { divisions } from '../master-data.resources'
</script>

<template><FormView title="Create Divisions" :resource="divisions" /></template>
