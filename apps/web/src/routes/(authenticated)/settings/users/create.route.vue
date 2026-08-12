<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { users } from './users.resource'
</script>

<template><FormView v-bind="users.create()" title="Create User" /></template>
