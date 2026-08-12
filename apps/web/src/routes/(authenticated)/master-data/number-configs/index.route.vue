<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from './number-configs.resource'
</script>
<template><ListView v-bind="numberConfigs.list()" title="Number Configurations" /></template>
