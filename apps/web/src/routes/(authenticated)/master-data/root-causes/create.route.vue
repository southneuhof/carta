<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { rootCauses } from './root-causes.resource'
</script>

<template><FormView v-bind="rootCauses.create()" title="Create Penyebab QHSSE" /></template>
