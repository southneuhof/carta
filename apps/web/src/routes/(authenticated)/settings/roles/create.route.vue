<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
</script>

<template>
  <FormView v-bind="roles.create()" title="Create Role" />
</template>
