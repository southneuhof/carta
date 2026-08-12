<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { permissionResource } from '../permissions.resource'
const route = useRoute('settings-permissions-detail')
</script>
<template><DetailView v-bind="permissionResource.detail({ id: String(route.params.permissionId) })" title="Permission" :back-to="{ name: 'settings-permissions' }" /></template>
