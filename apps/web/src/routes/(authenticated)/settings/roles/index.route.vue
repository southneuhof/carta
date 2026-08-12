<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { roles } from './roles.resource'
</script>

<template>
  <ListView v-bind="roles.list()" title="Roles" />
</template>
