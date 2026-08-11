<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
</script>

<template>
  <FormView title="Create Role" :resource="roles" :form-options="{ context: { operation: 'create' } }" />
</template>
