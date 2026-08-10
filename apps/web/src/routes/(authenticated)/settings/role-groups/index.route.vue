<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { roleGroups } from './role-groups.resource'
</script>
<template><ListView title="Role Groups" :resource="roleGroups" /></template>
