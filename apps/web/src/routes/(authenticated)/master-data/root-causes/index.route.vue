<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { rootCauses } from './root-causes.resource'
</script>
<template><ListView v-bind="rootCauses.list()" title="Penyebab QHSSE" /></template>
