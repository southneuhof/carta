<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { numberConfigs } from '../master-data.resources'
</script>
<template><ListView title="Number Configurations" :resource="numberConfigs" /></template>
