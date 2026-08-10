<script setup lang="ts">
import { FormView } from '@southneuhof/is-vue-framework'
import { roleGroups } from './role-groups.resource'
</script>
<template><FormView title="Create Role Group" :resource="roleGroups" /></template>
