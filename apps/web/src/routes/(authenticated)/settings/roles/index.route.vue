<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
</script>

<template>
  <ListView title="Roles" :resource="roles" />
</template>
