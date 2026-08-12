<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { numberVariables } from './number-variables.resource'
</script>
<template><ListView v-bind="numberVariables.list()" title="Number Variables" /></template>
