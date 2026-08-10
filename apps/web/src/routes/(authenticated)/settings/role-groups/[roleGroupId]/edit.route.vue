<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { roleGroups } from '../role-groups.resource'
const route = useRoute('settings-role-groups-edit')
</script>
<template><FormView title="Edit Role Group" :resource="roleGroups" :id="String(route.params.roleGroupId)" /></template>
