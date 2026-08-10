<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { permissionResource } from '../permissions.resource'
const route = useRoute('settings-permissions-edit')
</script>
<template><FormView title="Edit Permission" :resource="permissionResource" :id="String(route.params.permissionId)" /></template>
