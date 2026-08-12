<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { pts } from './pts.resource'
</script>

<template><FormView v-bind="pts.create()" title="Create Manual PTS" /></template>
