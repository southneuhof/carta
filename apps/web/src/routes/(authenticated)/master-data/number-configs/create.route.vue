<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from './number-configs.resource'
</script>

<template><FormView v-bind="numberConfigs.create()" title="Create Number Configs" /></template>
