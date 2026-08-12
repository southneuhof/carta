<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { uoms } from './uoms.resource'
</script>

<template><FormView v-bind="uoms.create()" title="Create Satuan" /></template>
