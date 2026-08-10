<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { roleGroups } from '../role-groups.resource'
const route = useRoute('settings-role-groups-detail')
</script>
<template><DetailView title="Role Group" :back-to="{ name: 'settings-role-groups' }" :resource="roleGroups" :id="String(route.params.roleGroupId)" /></template>
