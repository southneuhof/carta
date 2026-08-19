<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { permitWorkTypes } from './permit-work-types.resource'
</script>

<template><ListView v-bind="permitWorkTypes.list()" title="Tipe Pekerjaan" /></template>
