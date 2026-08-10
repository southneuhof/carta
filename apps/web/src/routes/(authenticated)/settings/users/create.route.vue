<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { users } from './users.resource'
</script>

<template><FormView title="Create User" :resource="users" :form-options="{ context: { operation: 'create' } }" /></template>
