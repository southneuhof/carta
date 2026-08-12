<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { users } from './users.resource'
</script>

<template>
  <div>
    <ListView v-bind="users.list()" title="Users" />
  </div>
</template>
