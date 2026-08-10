<script setup lang="ts">
import { useRoute } from 'vue-router'
import { DetailView } from '@southneuhof/is-vue-framework'
import { workItems } from '../../master-data.resources'

const route = useRoute('master-data-work-items-detail')
</script>

<template><DetailView title="Work Items" :back-to="{ name: 'master-data-work-items' }" :resource="workItems" :id="String(route.params.workItemId)" /></template>
