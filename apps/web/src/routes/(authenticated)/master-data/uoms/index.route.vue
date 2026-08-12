<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { uoms } from './uoms.resource'
</script>
<template><ListView v-bind="uoms.list()" title="Satuan" /></template>
