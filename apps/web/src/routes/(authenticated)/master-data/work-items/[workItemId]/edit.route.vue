<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FormView } from '@southneuhof/is-vue-framework'
import { workItems } from '../../master-data.resources'

const route = useRoute('master-data-work-items-edit')
</script>

<template><FormView title="Edit Work Items" :resource="workItems" :id="String(route.params.workItemId)" /></template>
