<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { divisions } from './divisions.resource'
</script>
<template><ListView v-bind="divisions.list()" title="Divisi" /></template>
