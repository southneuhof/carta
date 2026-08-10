<script setup lang="ts">
import { ListView } from '@southneuhof/is-vue-framework'
import { permissionResource } from './permissions.resource'
</script>
<template><ListView title="Permissions" :resource="permissionResource" /></template>
