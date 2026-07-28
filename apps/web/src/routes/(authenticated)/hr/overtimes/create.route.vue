<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { overtimes } from './overtimes.resource'
</script>

<template>
  <FormView title="Request Overtime" :resource="overtimes" success-message="Overtime request saved as a draft." />
</template>
