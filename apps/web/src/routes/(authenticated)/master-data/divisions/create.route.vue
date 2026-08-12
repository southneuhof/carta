<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { divisions } from './divisions.resource'
</script>

<template><FormView v-bind="divisions.create()" title="Create Divisi" /></template>
