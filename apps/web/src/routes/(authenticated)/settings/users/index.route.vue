<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { users } from './users.resource'
import type { User } from './users.operations'

</script>

<template>
  <ListView title="Users" :resource="users" :table-options="{ pagination: 'always' }"/>
</template>
